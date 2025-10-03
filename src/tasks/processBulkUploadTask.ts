/* eslint-disable max-lines -- This is a big file but that's the nature of the beast for now
 * See https://github.com/PhilanthropyDataCommons/service/issues/1978
 */
import fs from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { parse } from 'csv-parse';
import tmp from 'tmp-promise';
import { async as AsyncZip } from 'node-stream-zip';
import { lookup } from 'mime-types';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client } from '../s3';
import { db } from '../database/db';
import { getDefaultS3Bucket } from '../config';
import {
	createApplicationForm,
	createApplicationFormField,
	createOpportunity,
	createChangemakerProposal,
	createProposal,
	createProposalFieldValue,
	createProposalVersion,
	loadBaseFields,
	loadBulkUploadTask,
	loadOrCreateChangemaker,
	updateBulkUploadTask,
	loadSystemUser,
	loadUserByKeycloakUserId,
	createFile,
} from '../database/operations';
import {
	TaskStatus,
	isProcessBulkUploadJobPayload,
	BaseFieldDataType,
} from '../types';
import { fieldValueIsValid } from '../fieldValidation';
import { allNoLeaks } from '../promises';
import { SINGLE_STEP } from '../constants';
import { createBulkUploadLog } from '../database/operations/bulkUploadLogs/createBulkUploadLog';
import { getBulkUploadLogDetailsFromError } from './getBulkUploadLogDetailsFromError';
import type { TinyPg } from 'tinypg';
import type { JobHelpers, Logger } from 'graphile-worker';
import type { FileResult } from 'tmp-promise';
import type {
	BulkUploadTask,
	ProposalFieldValue,
	AuthContext,
	File,
	WritableApplicationFormField,
} from '../types';

const CHANGEMAKER_TAX_ID_SHORT_CODE = 'organization_tax_id';
const CHANGEMAKER_NAME_SHORT_CODE = 'organization_name';

const downloadFileDataToTemporaryStorage = async (
	file: File,
	logger: Logger,
): Promise<FileResult> => {
	const temporaryFile = await tmp.file().catch((err: unknown) => {
		throw new Error('Unable to create a temporary file', { cause: err });
	});

	const writeStream = fs.createWriteStream(temporaryFile.path, {
		autoClose: true,
	});

	const s3Response = await getS3Client({
		region: file.s3Bucket.region,
		endpoint: file.s3Bucket.endpoint,
	})
		.getObject({
			Key: file.storageKey,
			Bucket: file.s3Bucket.name,
		})
		.catch(async (err: unknown) => {
			logger.error('Failed to load an object from S3', {
				err,
				file,
			});
			await temporaryFile.cleanup();
			throw new Error('Failed to download an object from S3', { cause: err });
		});
	if (s3Response.Body === undefined) {
		throw new Error('S3 did not return a body');
	}

	const { Body: s3Body } = s3Response;
	if (!(s3Body instanceof Readable)) {
		throw new Error('S3 response body is not a readable stream');
	}

	try {
		await finished(s3Body.pipe(writeStream));
	} catch (err) {
		await temporaryFile.cleanup();
		throw err;
	}

	return temporaryFile;
};

const loadShortCodesFromBulkUploadTaskCsv = async (
	csvPath: string,
): Promise<string[]> => {
	let shortCodes: string[] = [];
	let hasLoadedShortCodes = false;
	const parser = fs.createReadStream(csvPath).pipe(
		// Loading the entire CSV is a waste, but the `to` option is currently broken
		// See https://github.com/adaltas/node-csv/issues/410
		parse(),
	);
	await parser.forEach((record: string[]) => {
		if (!hasLoadedShortCodes) {
			shortCodes = record;
			hasLoadedShortCodes = true;
		}
	});
	return shortCodes;
};

const assertShortCodesReferToExistingBaseFields = async (
	shortCodes: string[],
): Promise<void> => {
	const baseFields = await loadBaseFields();
	shortCodes.forEach((shortCode) => {
		const baseField = baseFields.find(
			(baseFieldCandidate) => baseFieldCandidate.shortCode === shortCode,
		);
		if (baseField === undefined) {
			throw new Error(`${shortCode} is not a valid BaseField short code.`);
		}
	});
};

const assertShortCodesAreValid = async (
	shortCodes: string[],
): Promise<void> => {
	await assertShortCodesReferToExistingBaseFields(shortCodes);
};

/* eslint-disable-next-line @typescript-eslint/no-magic-numbers --
 * The meaning of "0" here is pretty explicit, especially wrapped in a named helper
 */
const isEmpty = (arr: unknown[]): boolean => arr.length === 0;

const assertCsvContainsValidShortCodes = async (
	csvPath: string,
): Promise<void> => {
	const shortCodes = await loadShortCodesFromBulkUploadTaskCsv(csvPath);
	if (isEmpty(shortCodes)) {
		throw new Error('No short codes detected in the first row of the CSV');
	}
	await assertShortCodesAreValid(shortCodes);
};

const assertCsvContainsRowsOfEqualLength = async (
	csvPath: string,
): Promise<void> => {
	const csvReadStream = fs.createReadStream(csvPath);
	const parser = parse();
	parser.on('readable', () => {
		while (parser.read() !== null) {
			// Iterate through the data -- an error will be thrown if
			// any columns have a different number of fields
			// see https://csv.js.org/parse/options/relax_column_count/
		}
	});
	csvReadStream.pipe(parser);
	await finished(parser);
};

const assertBulkUploadTaskCsvIsValid = async (
	csvPath: string,
): Promise<void> => {
	await assertCsvContainsValidShortCodes(csvPath);
	await assertCsvContainsRowsOfEqualLength(csvPath);
};

const generateWritableApplicationFormFields = async (
	csvPath: string,
	applicationFormId: number,
): Promise<WritableApplicationFormField[]> => {
	const shortCodes = await loadShortCodesFromBulkUploadTaskCsv(csvPath);
	const baseFields = await loadBaseFields();
	const writableApplicationFormFields = shortCodes.map(
		(shortCode, index): WritableApplicationFormField => {
			const baseField = baseFields.find(
				(candidateBaseField) => candidateBaseField.shortCode === shortCode,
			);
			if (baseField === undefined) {
				throw new Error(
					`No base field could be found with shortCode "${shortCode}"`,
				);
			}
			return {
				applicationFormId,
				baseFieldShortCode: baseField.shortCode,
				position: index,
				label: baseField.label,
				instructions: null,
			};
		},
	);
	return writableApplicationFormFields;
};

const getChangemakerTaxIdIndex = (columns: string[]): number =>
	columns.indexOf(CHANGEMAKER_TAX_ID_SHORT_CODE);

const getChangemakerNameIndex = (columns: string[]): number =>
	columns.indexOf(CHANGEMAKER_NAME_SHORT_CODE);

// THIS FUNCTION IS A MONKEY PATCH
// Really we should be passing the jwt of the calling user so that an auth context can be re-generated
// for the task runner.  Currently this means the task runner is functioning as an administrative system user.
// This creates risk where a task could behave in ways with escalated privileges, although currently
// the implementation of the bulk upload processer should be safe.
const loadSystemUserAuthContext = async (): Promise<AuthContext> => ({
	user: await loadSystemUser(db, null),
	role: {
		isAdministrator: true,
	},
});

const loadTaskAuthContext = async (
	bulkUploadTask: BulkUploadTask,
): Promise<AuthContext> => ({
	user: await loadUserByKeycloakUserId(db, null, bulkUploadTask.createdBy),
	role: {
		isAdministrator: false,
	},
});

const cleanupTemporaryFileMap = async (
	temporaryFileMap: Map<string, FileResult>,
	logger: Logger,
): Promise<void> => {
	const temporaryFileEntries = Array.from(temporaryFileMap.entries());
	await Promise.all(
		temporaryFileEntries.map(async ([relativePath, temporaryFile]) => {
			try {
				await temporaryFile.cleanup();
			} catch (err) {
				logger.warn(
					`Cleanup of temporary file failed (${relativePath} -> ${temporaryFile.path})`,
					{ err },
				);
			}
		}),
	);
};

const getMimeType = (filePath: string): string => {
	const detectedMimeType = lookup(filePath);
	if (detectedMimeType === false) {
		return 'application/octet-stream';
	}
	return detectedMimeType;
};

const getFileNameFromPath = (filePath: string): string => {
	const name = filePath.split('/').pop();
	if (name === undefined) {
		return filePath;
	}
	return name;
};

const removeFirstPathComponent = (path: string): string => {
	const pathComponents = path.split('/');
	pathComponents.shift();
	return pathComponents.join('/');
};

const uploadFileDataToS3 = async (
	file: File,
	fileData: FileResult,
	relativePath: string,
	logger: Logger,
): Promise<File> => {
	const fileStream = fs.createReadStream(fileData.path);
	const s3Client = getS3Client();

	try {
		await s3Client.send(
			new PutObjectCommand({
				Bucket: file.s3Bucket.name,
				Key: file.storageKey,
				Body: fileStream,
				ContentType: file.mimeType,
			}),
		);
	} finally {
		if (!fileStream.destroyed) {
			fileStream.destroy();
		}
	}

	logger.debug('Uploaded file data to S3 ', {
		relativePath,
		storageKey: file.storageKey,
	});

	return file;
};

const prepareProposalAttachments = async (
	bulkUploadTask: BulkUploadTask,
	logger: Logger,
): Promise<Map<string, FileResult>> => {
	const temporaryFileMap = new Map<string, FileResult>();

	if (bulkUploadTask.attachmentsArchiveFile !== null) {
		const temporaryAttachmentsArchiveFile =
			await downloadFileDataToTemporaryStorage(
				bulkUploadTask.attachmentsArchiveFile,
				logger,
			).catch((err: unknown) => {
				logger.warn('Download of attachments archive file from S3 failed', {
					err,
				});
				throw err;
			});

		try {
			const attachmentsArchiveZip = new AsyncZip({
				file: temporaryAttachmentsArchiveFile.path,
			});
			try {
				const attachmentsArchiveEntries = await attachmentsArchiveZip
					.entries()
					.catch((err: unknown) => {
						throw new Error(
							`Failed to load the entries of attachments archive: ${String(err)}`,
						);
					});

				await allNoLeaks(
					Object.keys(attachmentsArchiveEntries).map(async (relativePath) => {
						const normalizedPath = removeFirstPathComponent(relativePath);
						const { [relativePath]: archiveEntry } = attachmentsArchiveEntries;
						if (archiveEntry === undefined || archiveEntry.isDirectory) {
							return;
						}

						try {
							const temporaryFile = await tmp.file().catch(() => {
								throw new Error(
									`Unable to create temporary file for ${relativePath}`,
								);
							});
							await attachmentsArchiveZip.extract(
								relativePath,
								temporaryFile.path,
							);
							temporaryFileMap.set(normalizedPath, temporaryFile);
						} catch (err) {
							logger.warn(`Failed to extract file from archive`, {
								relativePath,
								err,
							});
							throw err;
						}
					}),
				);
			} finally {
				await attachmentsArchiveZip.close();
			}
		} catch (err) {
			logger.warn('Failed to prepare attachments', { err });
			throw err;
		} finally {
			try {
				await temporaryAttachmentsArchiveFile.cleanup();
			} catch (err: unknown) {
				logger.warn(
					`Cleanup of attachments archive file failed (${temporaryAttachmentsArchiveFile.path})`,
					{ err },
				);
			}
		}
	}

	return temporaryFileMap;
};

class AttachmentsManager {
	private readonly attachmentPdcFiles = new Map<string, File>();

	constructor(
		private readonly dbConnection: TinyPg,
		private readonly authContext: AuthContext,
		private readonly attachmentTemporaryFiles: Map<string, FileResult>,
		private readonly logger: Logger,
	) {}

	public async getAttachmentPdcFile(relativePath: string): Promise<File> {
		const cachedPdcFile = this.attachmentPdcFiles.get(relativePath);
		if (cachedPdcFile !== undefined) {
			return cachedPdcFile;
		}

		const temporaryFile = this.attachmentTemporaryFiles.get(relativePath);
		if (temporaryFile === undefined) {
			throw new Error(
				`No file found for attachment with path "${relativePath}"`,
			);
		}

		const { size } = await stat(temporaryFile.path);
		const mimeType = getMimeType(relativePath);
		const s3Bucket = getDefaultS3Bucket();
		const fileName = getFileNameFromPath(relativePath);
		const file = await createFile(this.dbConnection, this.authContext, {
			name: fileName,
			mimeType,
			size,
			s3BucketName: s3Bucket.name,
		});

		await uploadFileDataToS3(file, temporaryFile, relativePath, this.logger);
		this.attachmentPdcFiles.set(relativePath, file);
		return file;
	}

	public cleanup(): void {
		this.attachmentPdcFiles.clear();
	}
}

export const processBulkUploadTask = async (
	payload: unknown,
	helpers: JobHelpers,
): Promise<void> => {
	if (!isProcessBulkUploadJobPayload(payload)) {
		helpers.logger.error('Malformed bulk upload job payload', {
			errors: isProcessBulkUploadJobPayload.errors ?? [],
		});
		return;
	}
	const systemUserAuthContext = await loadSystemUserAuthContext();
	helpers.logger.debug(
		`Started processBulkUpload Job for Bulk Upload ID ${payload.bulkUploadId}`,
	);
	const bulkUploadTask = await loadBulkUploadTask(
		db,
		systemUserAuthContext,
		payload.bulkUploadId,
	);

	const taskAuthContext = await loadTaskAuthContext(bulkUploadTask);
	if (bulkUploadTask.status !== TaskStatus.PENDING) {
		helpers.logger.warn(
			'Bulk upload cannot be processed because it is not in a PENDING state',
			{ bulkUploadTask },
		);
		return;
	}

	await updateBulkUploadTask(
		db,
		taskAuthContext,
		{
			status: TaskStatus.IN_PROGRESS,
		},
		bulkUploadTask.id,
	);

	const temporaryProposalsDataFile = await downloadFileDataToTemporaryStorage(
		bulkUploadTask.proposalsDataFile,
		helpers.logger,
	).catch(async (err: unknown) => {
		helpers.logger.warn('Download of bulk upload file from S3 failed', { err });
		await createBulkUploadLog(db, taskAuthContext, {
			bulkUploadTaskId: bulkUploadTask.id,
			isError: true,
			details: getBulkUploadLogDetailsFromError(err),
		});
	});

	if (temporaryProposalsDataFile === undefined) {
		await updateBulkUploadTask(
			db,
			taskAuthContext,
			{
				status: TaskStatus.FAILED,
			},
			bulkUploadTask.id,
		);
		return;
	}

	const temporaryProposalAttachmentFiles = await prepareProposalAttachments(
		bulkUploadTask,
		helpers.logger,
	).catch((err: unknown) => {
		helpers.logger.warn('Preparation of proposal attachments failed', {
			err,
		});
	});

	if (temporaryProposalAttachmentFiles === undefined) {
		await updateBulkUploadTask(
			db,
			taskAuthContext,
			{
				status: TaskStatus.FAILED,
			},
			bulkUploadTask.id,
		);
		return;
	}

	let bulkUploadHasFailed = false;
	const shortCodes = await loadShortCodesFromBulkUploadTaskCsv(
		temporaryProposalsDataFile.path,
	);
	const changemakerNameIndex = getChangemakerNameIndex(shortCodes);
	const changemakerTaxIdIndex = getChangemakerTaxIdIndex(shortCodes);

	try {
		await assertBulkUploadTaskCsvIsValid(temporaryProposalsDataFile.path);

		await db.transaction(async (transactionDb) => {
			const attachmentsManager = new AttachmentsManager(
				transactionDb,
				taskAuthContext,
				temporaryProposalAttachmentFiles,
				helpers.logger,
			);
			const opportunity = await createOpportunity(
				transactionDb,
				taskAuthContext,
				{
					title: `Bulk Upload (${bulkUploadTask.createdAt})`,
					funderShortCode: bulkUploadTask.funderShortCode,
				},
			);
			const applicationForm = await createApplicationForm(
				transactionDb,
				taskAuthContext,
				{
					opportunityId: opportunity.id,
				},
			);
			const proposedApplicationFormFields =
				await generateWritableApplicationFormFields(
					temporaryProposalsDataFile.path,
					applicationForm.id,
				);
			const applicationFormFields = await allNoLeaks(
				proposedApplicationFormFields.map(
					async (writableApplicationFormField) =>
						await createApplicationFormField(
							transactionDb,
							taskAuthContext,
							writableApplicationFormField,
						),
				),
			);
			const csvReadStream = fs.createReadStream(
				temporaryProposalsDataFile.path,
			);
			const STARTING_ROW = 2;
			const parser = parse({
				from: STARTING_ROW,
			});
			csvReadStream.pipe(parser);
			let recordNumber = 0;

			await parser.forEach(async (record: string[]) => {
				recordNumber += SINGLE_STEP;
				const proposal = await createProposal(transactionDb, taskAuthContext, {
					opportunityId: opportunity.id,
					externalId: `${recordNumber}`,
				});
				const proposalVersion = await createProposalVersion(
					transactionDb,
					taskAuthContext,
					{
						proposalId: proposal.id,
						applicationFormId: applicationForm.id,
						sourceId: bulkUploadTask.sourceId,
					},
				);

				const {
					[changemakerNameIndex]: changemakerName,
					[changemakerTaxIdIndex]: changemakerTaxId,
				} = record;
				if (changemakerTaxId !== undefined) {
					const changemaker = await loadOrCreateChangemaker(
						transactionDb,
						taskAuthContext,
						{
							name: changemakerName ?? 'Unnamed Organization',
							taxId: changemakerTaxId,
							keycloakOrganizationId: null,
						},
					);
					await createChangemakerProposal(transactionDb, taskAuthContext, {
						changemakerId: changemaker.id,
						proposalId: proposal.id,
					});
				}

				await allNoLeaks(
					record.map<Promise<ProposalFieldValue>>(async (fieldValue, index) => {
						const { [index]: applicationFormField } = applicationFormFields;
						if (applicationFormField === undefined) {
							throw new Error(
								'There is no form field associated with this column',
							);
						}

						let processedFieldValue = fieldValue;
						let isValid = fieldValueIsValid(
							fieldValue,
							applicationFormField.baseField.dataType,
						);

						// File attachments are the one unique case where we need to convert the bulk upload value
						// into a PDC File ID.  The value in the CSV is the relative path of the file within the
						// attachments archive.
						if (
							applicationFormField.baseField.dataType === BaseFieldDataType.FILE
						) {
							const pdcFile =
								await attachmentsManager.getAttachmentPdcFile(fieldValue);
							processedFieldValue = pdcFile.id.toString();
							isValid = true;
						}

						return await createProposalFieldValue(
							transactionDb,
							taskAuthContext,
							{
								proposalVersionId: proposalVersion.id,
								applicationFormFieldId: applicationFormField.id,
								value: processedFieldValue,
								position: index,
								isValid,
								goodAsOf: null,
							},
						);
					}),
				);
			});
		});
	} catch (err) {
		helpers.logger.info('Bulk upload has failed', { err });
		await createBulkUploadLog(db, taskAuthContext, {
			bulkUploadTaskId: bulkUploadTask.id,
			isError: true,
			details: getBulkUploadLogDetailsFromError(err),
		});
		bulkUploadHasFailed = true;
	}

	try {
		await temporaryProposalsDataFile.cleanup();
	} catch (err) {
		const message = `Cleanup of a temporary file failed (${temporaryProposalsDataFile.path})`;
		helpers.logger.warn(message, { err });
		await createBulkUploadLog(db, taskAuthContext, {
			bulkUploadTaskId: bulkUploadTask.id,
			// `isError` is intended for UIs to find an explanation for bulk upload failure. Not this.
			isError: false,
			details: getBulkUploadLogDetailsFromError(
				new Error(message, { cause: err }),
			),
		});
	}

	try {
		await cleanupTemporaryFileMap(
			temporaryProposalAttachmentFiles,
			helpers.logger,
		);
	} catch (err) {
		helpers.logger.warn('Cleanup of temporary attachment files failed', {
			err,
		});
	}

	if (bulkUploadHasFailed) {
		await updateBulkUploadTask(
			db,
			taskAuthContext,
			{
				status: TaskStatus.FAILED,
			},
			bulkUploadTask.id,
		);
	} else {
		await updateBulkUploadTask(
			db,
			taskAuthContext,
			{
				status: TaskStatus.COMPLETED,
			},
			bulkUploadTask.id,
		);
	}
};
