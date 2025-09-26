import fs from 'node:fs';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { parse } from 'csv-parse';
import tmp from 'tmp-promise';
import { getS3Client } from '../s3';
import { db } from '../database/db';
import {
	createApplicationForm,
	createApplicationFormField,
	createBulkUploadLog,
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
} from '../database/operations';
import { TaskStatus, isProcessBulkUploadJobPayload } from '../types';
import { fieldValueIsValid } from '../fieldValidation';
import { allNoLeaks } from '../promises';
import { SINGLE_STEP } from '../constants';
import { getBulkUploadLogDetailsFromError } from './getBulkUploadLogDetailsFromError';
import type { JobHelpers, Logger as GraphileLogger } from 'graphile-worker';
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
	graphileLogger: GraphileLogger,
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
			graphileLogger.error('Failed to load an object from S3', {
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

export const processBulkUploadTask = async (
	payload: unknown,
	helpers: JobHelpers,
): Promise<void> => {
	const { logger: graphileLogger } = helpers;
	if (!isProcessBulkUploadJobPayload(payload)) {
		graphileLogger.error('Malformed bulk upload job payload', {
			errors: isProcessBulkUploadJobPayload.errors ?? [],
		});
		return;
	}
	const systemUserAuthContext = await loadSystemUserAuthContext();
	graphileLogger.debug(
		`Started processBulkUpload Job for Bulk Upload ID ${payload.bulkUploadId}`,
	);
	const bulkUploadTask = await loadBulkUploadTask(
		db,
		systemUserAuthContext,
		payload.bulkUploadId,
	);

	const taskAuthContext = await loadTaskAuthContext(bulkUploadTask);
	if (bulkUploadTask.status !== TaskStatus.PENDING) {
		graphileLogger.warn(
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

	const bulkUploadFile = await downloadFileDataToTemporaryStorage(
		bulkUploadTask.proposalsDataFile,
		graphileLogger,
	).catch(async (err: unknown) => {
		graphileLogger.warn('Download of bulk upload file from S3 failed', { err });
		await createBulkUploadLog(db, taskAuthContext, {
			bulkUploadTaskId: bulkUploadTask.id,
			isError: true,
			details: getBulkUploadLogDetailsFromError(err),
		});
	});

	if (bulkUploadFile === undefined) {
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
		bulkUploadFile.path,
	);
	const changemakerNameIndex = getChangemakerNameIndex(shortCodes);
	const changemakerTaxIdIndex = getChangemakerTaxIdIndex(shortCodes);

	try {
		await assertBulkUploadTaskCsvIsValid(bulkUploadFile.path);

		await db.transaction(async (transactionDb) => {
			const opportunity = await createOpportunity(transactionDb, taskAuthContext, {
				title: `Bulk Upload (${bulkUploadTask.createdAt})`,
				funderShortCode: bulkUploadTask.funderShortCode,
			});
			const applicationForm = await createApplicationForm(transactionDb, taskAuthContext, {
				opportunityId: opportunity.id,
			});
			const proposedApplicationFormFields =
				await generateWritableApplicationFormFields(
					bulkUploadFile.path,
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
			const csvReadStream = fs.createReadStream(bulkUploadFile.path);
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
						const isValid = fieldValueIsValid(
							fieldValue,
							applicationFormField.baseField.dataType,
						);
						return await createProposalFieldValue(
							transactionDb,
							taskAuthContext,
							{
								proposalVersionId: proposalVersion.id,
								applicationFormFieldId: applicationFormField.id,
								value: fieldValue,
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
		graphileLogger.info('Bulk upload has failed', { err });
		await createBulkUploadLog(db, taskAuthContext, {
			bulkUploadTaskId: bulkUploadTask.id,
			isError: true,
			details: getBulkUploadLogDetailsFromError(err),
		});
		bulkUploadHasFailed = true;
	}

	try {
		await bulkUploadFile.cleanup();
	} catch (err) {
		const message = `Cleanup of a temporary file failed (${bulkUploadFile.path})`;
		graphileLogger.warn(message, { err });
		await createBulkUploadLog(db, taskAuthContext, {
			bulkUploadTaskId: bulkUploadTask.id,
			// `isError` is intended for UIs to find an explanation for bulk upload failure. Not this.
			isError: false,
			details: getBulkUploadLogDetailsFromError(
				new Error(message, { cause: err }),
			),
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
