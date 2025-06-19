import fs from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { parse } from 'csv-parse';
import { requireEnv } from 'require-env-variable';
import tmp from 'tmp-promise';
import {
	s3Client,
	S3_BULK_UPLOADS_KEY_PREFIX,
	S3_UNPROCESSED_KEY_PREFIX,
} from '../s3Client';
import { db } from '../database/db';
import {
	createApplicationForm,
	createApplicationFormField,
	createOpportunity,
	createChangemaker,
	createChangemakerProposal,
	createProposal,
	createProposalFieldValue,
	createProposalVersion,
	loadBaseFields,
	loadBulkUploadTask,
	loadChangemakerByTaxId,
	updateBulkUploadTask,
	loadSystemUser,
	loadUserByKeycloakUserId,
} from '../database/operations';
import { TaskStatus, isProcessBulkUploadJobPayload } from '../types';
import { fieldValueIsValid } from '../fieldValidation';
import { allNoLeaks } from '../promises';
import type { JobHelpers, Logger } from 'graphile-worker';
import type { FileResult } from 'tmp-promise';
import type {
	ApplicationFormField,
	BulkUploadTask,
	Opportunity,
	Changemaker,
	ProposalFieldValue,
	WritableChangemaker,
	AuthContext,
} from '../types';

const { S3_BUCKET } = requireEnv('S3_BUCKET');
const CHANGEMAKER_TAX_ID_SHORT_CODE = 'organization_tax_id';
const CHANGEMAKER_NAME_SHORT_CODE = 'organization_name';

const downloadS3ObjectToTemporaryStorage = async (
	key: string,
	logger: Logger,
): Promise<FileResult> => {
	const temporaryFile = await tmp.file().catch(() => {
		throw new Error('Unable to create a temporary file');
	});

	const writeStream = fs.createWriteStream(temporaryFile.path, {
		autoClose: true,
	});

	const s3Response = await s3Client
		.getObject({
			Key: key,
			Bucket: S3_BUCKET,
		})
		.catch(async (err) => {
			logger.error('Failed to load an object from S3', { err, key });
			await temporaryFile.cleanup();
			throw new Error('Unable to load the s3 object');
		});
	if (s3Response.Body === undefined) {
		throw new Error('S3 did not return a body');
	}

	const s3Body = s3Response.Body;
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
	await parser.forEach(async (record: string[]) => {
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

// The meaning of "0" here is pretty explicit, especially wrapped in a named helper
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
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

const createOpportunityForBulkUploadTask = async (
	bulkUploadTask: BulkUploadTask,
): Promise<Opportunity> =>
	createOpportunity(db, null, {
		title: `Bulk Upload (${bulkUploadTask.createdAt})`,
		funderShortCode: bulkUploadTask.funderShortCode,
	});

const createApplicationFormFieldsForBulkUploadTask = async (
	csvPath: string,
	applicationFormId: number,
): Promise<ApplicationFormField[]> => {
	const shortCodes = await loadShortCodesFromBulkUploadTaskCsv(csvPath);
	const baseFields = await loadBaseFields();
	const applicationFormFields = await allNoLeaks(
		shortCodes.map(async (shortCode, index) => {
			const baseField = baseFields.find(
				(candidateBaseField) => candidateBaseField.shortCode === shortCode,
			);
			if (baseField === undefined) {
				throw new Error(
					`No base field could be found with shortCode "${shortCode}"`,
				);
			}
			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId,
				baseFieldShortCode: baseField.shortCode,
				position: index,
				label: baseField.label,
			});
			return applicationFormField;
		}),
	);
	return applicationFormFields;
};

const getProcessedKey = (bulkUploadTask: BulkUploadTask): string =>
	`${S3_BULK_UPLOADS_KEY_PREFIX}/${bulkUploadTask.id}`;

const getChangemakerTaxIdIndex = (columns: string[]): number =>
	columns.indexOf(CHANGEMAKER_TAX_ID_SHORT_CODE);

const getChangemakerNameIndex = (columns: string[]): number =>
	columns.indexOf(CHANGEMAKER_NAME_SHORT_CODE);

const createOrLoadChangemaker = async (
	authContext: AuthContext,
	writeValues: Omit<WritableChangemaker, 'name'> & { name?: string },
): Promise<Changemaker | undefined> => {
	try {
		return await loadChangemakerByTaxId(db, authContext, writeValues.taxId);
	} catch {
		if (writeValues.name !== undefined) {
			return createChangemaker(db, null, {
				...writeValues,
				name: writeValues.name, // This looks silly, but TypeScript isn't guarding `writeValues`, just `writeValues.name`.
			});
		}
	}
	return undefined;
};

// THIS FUNCTION IS A MONKEY PATCH
// Really we should be passing the jwt of the calling user so that an auth context can be re-generated
// for the task runner.  Currently this means the task runner is functioning as an administrative system user.
// This creates risk where a task could behave in ways with escalated privileges, although currently
// the implementation of the bulk upload processer should be safe.
const loadTaskRunnerAuthContext = async (): Promise<AuthContext> => ({
	user: await loadSystemUser(db, null),
	role: {
		isAdministrator: true,
	},
});

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
	const taskRunnerAuthContext = await loadTaskRunnerAuthContext();
	helpers.logger.debug(
		`Started processBulkUpload Job for Bulk Upload ID ${payload.bulkUploadId}`,
	);
	const bulkUploadTask = await loadBulkUploadTask(
		db,
		taskRunnerAuthContext,
		payload.bulkUploadId,
	);
	if (bulkUploadTask.status !== TaskStatus.PENDING) {
		helpers.logger.warn(
			'Bulk upload cannot be processed because it is not in a PENDING state',
			{ bulkUploadTask },
		);
		return;
	}
	if (!bulkUploadTask.sourceKey.startsWith(S3_UNPROCESSED_KEY_PREFIX)) {
		helpers.logger.info(
			`Bulk upload task cannot be processed because the associated sourceKey does not begin with ${S3_UNPROCESSED_KEY_PREFIX}`,
			{ bulkUploadTask },
		);
		await updateBulkUploadTask(
			db,
			null,
			{
				status: TaskStatus.FAILED,
			},
			bulkUploadTask.id,
		);
		return;
	}

	await updateBulkUploadTask(
		db,
		null,
		{
			status: TaskStatus.IN_PROGRESS,
		},
		bulkUploadTask.id,
	);

	const bulkUploadFile = await downloadS3ObjectToTemporaryStorage(
		bulkUploadTask.sourceKey,
		helpers.logger,
	).catch(async (err) => {
		helpers.logger.warn('Download of bulk upload file from S3 failed', { err });
		await updateBulkUploadTask(
			db,
			null,
			{
				status: TaskStatus.FAILED,
			},
			bulkUploadTask.id,
		);
	});

	if (!bulkUploadFile) {
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
		const opportunity =
			await createOpportunityForBulkUploadTask(bulkUploadTask);
		const applicationForm = await createApplicationForm(db, null, {
			opportunityId: opportunity.id,
		});

		const applicationFormFields =
			await createApplicationFormFieldsForBulkUploadTask(
				bulkUploadFile.path,
				applicationForm.id,
			);
		const csvReadStream = fs.createReadStream(bulkUploadFile.path);
		const STARTING_ROW = 2;
		const parser = parse({
			from: STARTING_ROW,
		});
		csvReadStream.pipe(parser);
		let recordNumber = 0;

		// This is a monkey patch to create an "auth context" for the sole purpose
		// of populating `createdBy`.  This is shallow, and if we ever update our create
		// queries to require a full auth context, this will not be sufficient.
		const userAgentCreateAuthContext = {
			user: await loadUserByKeycloakUserId(db, null, bulkUploadTask.createdBy),
			role: {
				isAdministrator: false,
			},
		};
		await parser.forEach(async (record: string[]) => {
			recordNumber++;
			const proposal = await createProposal(db, userAgentCreateAuthContext, {
				opportunityId: opportunity.id,
				externalId: `${recordNumber}`,
			});
			const proposalVersion = await createProposalVersion(
				db,
				userAgentCreateAuthContext,
				{
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: bulkUploadTask.sourceId,
				},
			);

			const changemakerName = record[changemakerNameIndex];
			const changemakerTaxId = record[changemakerTaxIdIndex];
			if (changemakerTaxId !== undefined) {
				const changemaker = await createOrLoadChangemaker(
					taskRunnerAuthContext,
					{
						name: changemakerName,
						taxId: changemakerTaxId,
						keycloakOrganizationId: null,
					},
				);

				if (changemaker !== undefined) {
					await createChangemakerProposal(db, null, {
						changemakerId: changemaker.id,
						proposalId: proposal.id,
					});
				}
			}

			await allNoLeaks(
				record.map<Promise<ProposalFieldValue>>(async (fieldValue, index) => {
					const applicationFormField = applicationFormFields[index];
					if (applicationFormField === undefined) {
						throw new Error(
							'There is no form field associated with this column',
						);
					}
					const isValid = fieldValueIsValid(
						fieldValue,
						applicationFormField.baseField.dataType,
					);
					return createProposalFieldValue(db, null, {
						proposalVersionId: proposalVersion.id,
						applicationFormFieldId: applicationFormField.id,
						value: fieldValue,
						position: index,
						isValid,
						goodAsOf: null,
					});
				}),
			);
		});
	} catch (err) {
		helpers.logger.info('Bulk upload has failed', { err });
		bulkUploadHasFailed = true;
	}

	try {
		const fileStats = await fs.promises.stat(bulkUploadFile.path);
		const fileSize = fileStats.size;
		await updateBulkUploadTask(db, null, { fileSize }, bulkUploadTask.id);
	} catch (err) {
		helpers.logger.warn(
			`Unable to update the fileSize for bulkUploadTask ${bulkUploadTask.id}`,
			{ err },
		);
	}

	try {
		await bulkUploadFile.cleanup();
	} catch (err) {
		helpers.logger.warn(
			`Cleanup of a temporary file failed (${bulkUploadFile.path})`,
			{ err },
		);
	}

	try {
		const copySource = `${S3_BUCKET}/${bulkUploadTask.sourceKey}`;
		const copyDestination = getProcessedKey(bulkUploadTask);
		await s3Client.copyObject({
			Bucket: S3_BUCKET,
			CopySource: copySource,
			Key: copyDestination,
		});
		await s3Client.deleteObject({
			Bucket: S3_BUCKET,
			Key: bulkUploadTask.sourceKey,
		});
		await updateBulkUploadTask(
			db,
			null,
			{
				sourceKey: copyDestination,
			},
			bulkUploadTask.id,
		);
	} catch (err) {
		helpers.logger.warn(
			`Moving the bulk upload task file to final processed destination failed (${bulkUploadFile.path})`,
			{ err },
		);
	}

	if (bulkUploadHasFailed) {
		await updateBulkUploadTask(
			db,
			null,
			{
				status: TaskStatus.FAILED,
			},
			bulkUploadTask.id,
		);
	} else {
		await updateBulkUploadTask(
			db,
			null,
			{
				status: TaskStatus.COMPLETED,
			},
			bulkUploadTask.id,
		);
	}
};
