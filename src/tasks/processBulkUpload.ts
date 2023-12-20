import fs from 'fs';
import { finished } from 'stream/promises';
import { parse } from 'csv-parse';
import { requireEnv } from 'require-env-variable';
import tmp from 'tmp-promise';
import { s3Client } from '../s3Client';
import { db } from '../database/db';
import {
  loadBaseFields,
  loadBulkUpload,
} from '../database/operations/load';
import {
  BulkUploadStatus,
  isProcessBulkUploadJobPayload,
} from '../types';
import { NotFoundError } from '../errors';
import type { Readable } from 'stream';
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import type {
  JobHelpers,
  Logger,
} from 'graphile-worker';
import type { FileResult } from 'tmp-promise';
import type {
  Applicant,
  ApplicationForm,
  ApplicationFormField,
  BulkUpload,
  Opportunity,
  Proposal,
  ProposalFieldValue,
  ProposalVersion,
} from '../types';

const {
  S3_BUCKET,
} = requireEnv(
  'S3_BUCKET',
);

enum RequiredBulkUploadFields {
  PROPOSAL_SUBMITTER_EMAIL = 'proposal_submitter_email',
}

const updateBulkUploadStatus = async (
  id: number,
  status: BulkUploadStatus,
): Promise<void> => {
  const bulkUploadsQueryResult = await db.sql<BulkUpload>('bulkUploads.updateStatusById', {
    id,
    status,
  });
  if (bulkUploadsQueryResult.row_count !== 1) {
    throw new NotFoundError(`The bulk upload was not found (id: ${id})`);
  }
};

const downloadS3ObjectToTemporaryStorage = async (
  key: string,
  logger: Logger,
): Promise<FileResult> => {
  let temporaryFile: FileResult;
  try {
    temporaryFile = await tmp.file();
  } catch (err) {
    throw new Error('Unable to create a temporary file');
  }
  const writeStream = fs.createWriteStream(
    temporaryFile.path,
    { autoClose: true },
  );

  let s3Response: GetObjectCommandOutput;
  try {
    s3Response = await s3Client.getObject({
      Key: key,
      Bucket: S3_BUCKET,
    });
    if (s3Response.Body === undefined) {
      throw new Error('S3 did not return a body');
    }
  } catch (error) {
    logger.error(
      'Failed to load an object from S3',
      { error, key },
    );
    await temporaryFile.cleanup();
    throw new Error('Unable to load the s3 object');
  }

  const s3Body = (s3Response.Body as Readable);
  try {
    await finished(s3Body.pipe(writeStream));
  } catch (err) {
    await temporaryFile.cleanup();
    throw err;
  }

  return temporaryFile;
};

const loadShortCodesFromBulkUploadCsv = async (csvPath: string): Promise<string[]> => {
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
  return shortCodes ?? [];
};

const assertShortCodesIncludeRequiredFields = (shortCodes: string[]): void => {
  const requiredFields = Object.values(RequiredBulkUploadFields);
  requiredFields.forEach((requiredField) => {
    if (!shortCodes.find(
      (shortCode) => shortCode === requiredField.valueOf(),
    )) {
      throw new Error(`${requiredField.valueOf()} is a required field.`);
    }
  });
};

const assertShortCodesReferToExistingBaseFields = async (shortCodes: string[]): Promise<void> => {
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

const assertShortCodesAreValid = async (shortCodes: string[]): Promise<void> => {
  assertShortCodesIncludeRequiredFields(shortCodes);
  await assertShortCodesReferToExistingBaseFields(shortCodes);
};

const assertCsvContainsValidShortCodes = async (csvPath: string): Promise<void> => {
  const shortCodes = await loadShortCodesFromBulkUploadCsv(csvPath);
  if (shortCodes.length === 0) {
    throw new Error('No short codes detected in the first row of the CSV');
  }
  await assertShortCodesAreValid(shortCodes);
};

const assertCsvContainsRowsOfEqualLength = async (csvPath: string): Promise<void> => {
  const csvReadStream = fs.createReadStream(csvPath);
  const parser = parse();
  parser.on('readable', () => {
    while ((parser.read()) !== null) {
      // Iterate through the data -- an error will be thrown if
      // any columns have a different number of fields
      // see https://csv.js.org/parse/options/relax_column_count/
    }
  });
  csvReadStream.pipe(parser);
  await finished(parser);
};

const assertBulkUploadCsvIsValid = async (csvPath: string): Promise<void> => {
  await assertCsvContainsValidShortCodes(csvPath);
  await assertCsvContainsRowsOfEqualLength(csvPath);
};

export const getApplicantEmailFieldIndexForBulkUpload = async (
  csvPath: string,
): Promise<number> => {
  const shortCodes = await loadShortCodesFromBulkUploadCsv(csvPath);
  return shortCodes.findIndex(
    (shortCode) => shortCode === RequiredBulkUploadFields.PROPOSAL_SUBMITTER_EMAIL.valueOf(),
  );
};

const createOpportunityForBulkUpload = async (
  bulkUpload: BulkUpload,
): Promise<Opportunity> => {
  const result = await db.sql<Opportunity>('opportunities.insertOne', {
    title: `Bulk Upload (${bulkUpload.createdAt.getFullYear()}-${bulkUpload.createdAt.getMonth()}-${bulkUpload.createdAt.getDate()})`,
  });
  const opportunity = result.rows[0];
  if (opportunity === undefined) {
    throw new NotFoundError('The opportunity could not be created');
  }
  return opportunity;
};

const createApplicationFormForBulkUpload = async (
  opportunityId: number,
): Promise<ApplicationForm> => {
  const result = await db.sql<ApplicationForm>('applicationForms.insertOne', {
    opportunityId,
  });
  const applicationForm = result.rows[0];
  if (applicationForm === undefined) {
    throw new NotFoundError('The application form could not be created');
  }
  return applicationForm;
};

const createApplicationFormFieldsForBulkUpload = async (
  csvPath: string,
  applicationFormId: number,
): Promise<ApplicationFormField[]> => {
  const shortCodes = await loadShortCodesFromBulkUploadCsv(csvPath);
  const baseFields = await loadBaseFields();
  const applicationFormFields = await Promise.all(
    shortCodes.map(async (shortCode, index) => {
      const baseField = baseFields.find(
        (candidateBaseField) => candidateBaseField.shortCode === shortCode,
      );
      if (baseField === undefined) {
        throw new Error(`No base field could be found with shortCode "${shortCode}"`);
      }
      const result = await db.sql<ApplicationFormField>('applicationFormFields.insertOne', {
        applicationFormId,
        baseFieldId: baseField.id,
        position: index,
        label: baseField.label,
      });
      const applicationFormField = result.rows[0];
      if (applicationFormField === undefined) {
        throw new NotFoundError('The application form field could not be created');
      }
      return applicationFormField;
    }),
  );
  return applicationFormFields;
};

const createOrLoadApplicantForBulkUploadCsvRecord = async (
  externalId: string,
): Promise<Applicant> => {
  const result = await db.sql<Applicant>('applicants.insertOrLoadOne', {
    externalId,
    optedIn: false,
  });
  const applicant = result.rows[0];
  if (applicant === undefined) {
    throw new NotFoundError('The applicant did not exist and could not be created');
  }
  return applicant;
};

const createProposalForBulkUploadCsvRecord = async (
  applicantId: number,
  opportunityId: number,
  externalId: string,
): Promise<Proposal> => {
  const result = await db.sql<Proposal>('proposals.insertOne', {
    applicantId,
    opportunityId,
    externalId,
  });
  const proposal = result.rows[0];
  if (proposal === undefined) {
    throw new NotFoundError('The proposal could not be created');
  }
  return proposal;
};

const createProposalVersionForBulkUploadCsvRecord = async (
  proposalId: number,
  applicationFormId: number,
): Promise<ProposalVersion> => {
  const result = await db.sql<ProposalVersion>('proposalVersions.insertOne', {
    proposalId,
    applicationFormId,
  });
  const proposalVersion = result.rows[0];
  if (proposalVersion === undefined) {
    throw new NotFoundError('The proposal version form could not be created');
  }
  return proposalVersion;
};

const createProposalFieldValueForBulkUploadCsvRecord = async (
  proposalVersionId: number,
  applicationFormFieldId: number,
  value: string,
  position: number,
): Promise<ProposalFieldValue> => {
  const result = await db.sql<ProposalFieldValue>('proposalFieldValues.insertOne', {
    proposalVersionId,
    applicationFormFieldId,
    value,
    position,
  });
  const proposalFieldValue = result.rows[0];
  if (proposalFieldValue === undefined) {
    throw new NotFoundError('The proposal field value could not be created');
  }
  return proposalFieldValue;
};

export const processBulkUpload = async (
  payload: unknown,
  helpers: JobHelpers,
): Promise<void> => {
  if (!isProcessBulkUploadJobPayload(payload)) {
    helpers.logger.error('Malformed bulk upload job payload', { errors: isProcessBulkUploadJobPayload.errors ?? [] });
    return;
  }
  helpers.logger.debug(`Started processBulkUpload Job for Bulk Upload ID ${payload.bulkUploadId}`);
  const bulkUpload = await loadBulkUpload(payload.bulkUploadId);
  let bulkUploadFile: FileResult;
  try {
    await updateBulkUploadStatus(bulkUpload.id, BulkUploadStatus.IN_PROGRESS);
    bulkUploadFile = await downloadS3ObjectToTemporaryStorage(
      bulkUpload.sourceKey,
      helpers.logger,
    );
    await assertBulkUploadCsvIsValid(bulkUploadFile.path);
    const opportunity = await createOpportunityForBulkUpload(bulkUpload);
    const applicationForm = await createApplicationFormForBulkUpload(opportunity.id);
    const applicationFormFields = await createApplicationFormFieldsForBulkUpload(
      bulkUploadFile.path,
      applicationForm.id,
    );

    const applicantEmailFieldIndex = await getApplicantEmailFieldIndexForBulkUpload(
      bulkUploadFile.path,
    );
    const csvReadStream = fs.createReadStream(bulkUploadFile.path);
    const parser = parse({
      from: 2,
    });
    csvReadStream.pipe(parser);
    let recordNumber = 0;
    await parser.forEach(async (record: string[]) => {
      recordNumber += 1;
      const applicantEmail = record[applicantEmailFieldIndex];
      if (applicantEmail === undefined) {
        throw new Error('The applicant\'s email address must be provided.');
      }
      const applicant = await createOrLoadApplicantForBulkUploadCsvRecord(applicantEmail);
      const proposal = await createProposalForBulkUploadCsvRecord(
        applicant.id,
        opportunity.id,
        `${recordNumber}`,
      );
      const proposalVersion = await createProposalVersionForBulkUploadCsvRecord(
        proposal.id,
        applicationForm.id,
      );
      await Promise.all(record.map<Promise<ProposalFieldValue>>(
        async (fieldValue, index) => {
          const applicationFormField = applicationFormFields[index];
          if (applicationFormField === undefined) {
            throw new Error('There is no form field associated with this column');
          }
          return createProposalFieldValueForBulkUploadCsvRecord(
            proposalVersion.id,
            applicationFormField.id,
            fieldValue,
            index,
          );
        },
      ));
    });
  } catch (error) {
    helpers.logger.info('Bulk upload is being marked as failed', { error });
    await updateBulkUploadStatus(bulkUpload.id, BulkUploadStatus.FAILED);
    return;
  }
  try {
    await bulkUploadFile.cleanup();
  } catch (error) {
    helpers.logger.warn(
      `Cleanup of a temporary file failed (${bulkUploadFile.path})`,
      { error },
    );
  }
  await updateBulkUploadStatus(bulkUpload.id, BulkUploadStatus.COMPLETED);
};
