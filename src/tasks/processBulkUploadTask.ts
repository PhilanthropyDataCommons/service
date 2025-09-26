/* eslint-disable max-lines -- This is a big file but that's the nature of the beast for now */
import fs from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { parse } from 'csv-parse';
import tmp from 'tmp-promise';
import jszip from 'jszip';
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
	const temporaryFile = await tmp.file().catch(() => {
		throw new Error('Unable to create a temporary file');
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
			throw new Error('Unable to load the s3 object');
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
	for (const [relativePath, temporaryFile] of temporaryFileMap) {
		try {
			await temporaryFile.cleanup();
		} catch (err) {
			logger.warn(
				`Cleanup of temporary file failed (${relativePath} -> ${temporaryFile.path})`,
				{ err },
			);
		}
	}
};

const getMimeType = (filePath: string): string => {
	const detectedMimeType = lookup(filePath);
	if (detectedMimeType === false) {
		return 'application/octet-stream';
	}
	return detectedMimeType;
}

const getFileNameFromPath = (filePath: string): string => {
	const name = filePath.split('/').pop();
	if (name === undefined) {
		return filePath;
	}
	return name;
}

const uploadFileToS3AndCreateEntity = async (
	temporaryFile: FileResult,
	relativePath: string,
	authContext: AuthContext,
	logger: Logger,
): Promise<File> => {
	const { size } = await stat(temporaryFile.path);
	const mimeType = getMimeType(relativePath);
	const s3Bucket = getDefaultS3Bucket();
	const fileName = getFileNameFromPath(relativePath);
	const file = await createFile(db, authContext, {
		name: fileName,
		mimeType,
		size,
		s3BucketName: s3Bucket.name,
	});

	const fileStream = fs.createReadStream(temporaryFile.path);
	const s3Client = getS3Client();
	await s3Client.send(
		new PutObjectCommand({
			Bucket: s3Bucket.name,
			Key: file.storageKey,
			Body: fileStream,
			ContentType: mimeType,
		}),
	);

	logger.debug('Uploaded attachment file to S3 and created File entity', {
		relativePath,
		fileId: file.id,
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
		const attachmentsArchiveFile = await downloadFileDataToTemporaryStorage(
			bulkUploadTask.attachmentsArchiveFile,
			logger,
		).catch((err: unknown) => {
			logger.warn('Download of attachments archive file from S3 failed', {
				err,
			});
			throw err;
		});

		try {
			// Read the archive file and load it with jszip
			const attachmentsArchiveStream = fs.createReadStream(
				attachmentsArchiveFile.path,
			);
			const attachmentsArchiveZip = await jszip
				.loadAsync(attachmentsArchiveStream)
				.catch((err: unknown) => {
					throw new Error(
						`Failed to parse archive as zip file: ${String(err)}`,
					);
				});

			await allNoLeaks(
				Object.keys(attachmentsArchiveZip.files).map(async (relativePath) => {
					const { files: { relativePath: zipFile } } = attachmentsArchiveZip;
					if (zipFile === undefined || zipFile.dir) {
						return;
					}

					try {
						const temporaryFile = await tmp.file().catch(() => {
							throw new Error(
								`Unable to create temporary file for ${relativePath}`,
							);
						});

						const readStream = zipFile.nodeStream();
						const writeStream = fs.createWriteStream(temporaryFile.path);
						await finished(readStream.pipe(writeStream));

						temporaryFileMap.set(relativePath, temporaryFile);
					} catch (err) {
						logger.warn(`Failed to extract file from archive`, {
							relativePath,
							err,
						});
						throw err;
					}
				}),
			);
		} catch (err) {
			logger.warn('Failed to prepare attachments', { err });
			throw err;
		} finally {
			// Clean up the downloaded archive file
			try {
				await attachmentsArchiveFile.cleanup();
			} catch (err: unknown) {
				logger.warn(
					`Cleanup of attachments archive file failed (${attachmentsArchiveFile.path})`,
					{ err },
				);
			}
		}
	}

	return temporaryFileMap;
};

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
	).catch((err: unknown) => {
		helpers.logger.warn('Download of proposals data file from S3 failed', {
			err,
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

			// Cache for uploaded files to avoid duplicates
			const uploadedFilesCache = new Map<string, File>();

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

						DAN TO DO: actually implement all this

						let processedFieldValue = fieldValue;
						let isValid = fieldValueIsValid(
							fieldValue,
							applicationFormField.baseField.dataType,
						);

						// Handle file attachments
						if (
							applicationFormField.baseField.dataType ===
								BaseFieldDataType.FILE &&
							temporaryProposalAttachmentFiles.has(fieldValue)
						) {
							try {
								// Check cache first to avoid duplicate uploads
								let uploadedFile = uploadedFilesCache.get(fieldValue);
								if (uploadedFile === undefined) {
									const temporaryFile =
										temporaryProposalAttachmentFiles.get(fieldValue);
									if (temporaryFile !== undefined) {
										uploadedFile = await uploadFileToS3AndCreateEntity(
											temporaryFile,
											fieldValue,
											taskAuthContext,
											helpers.logger,
										);
										// Cache the result
										uploadedFilesCache.set(fieldValue, uploadedFile);
									}
								}
								processedFieldValue = uploadedFile.id.toString();
								isValid = true; // File upload successful means valid
							} catch (err) {
								helpers.logger.warn('Failed to upload attachment file', {
									fieldValue,
									err,
								});
								// Keep original field value and mark as invalid
								isValid = false;
							}
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
		bulkUploadHasFailed = true;
	}

	try {
		await temporaryProposalsDataFile.cleanup();
	} catch (err) {
		helpers.logger.warn(
			`Cleanup of a temporary file failed (${temporaryProposalsDataFile.path})`,
			{ err },
		);
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
