import { ajv } from '../ajv';
import { getLogger } from '../logger';
import { db } from '../database';
import {
	isApplicant,
	isApplicantArray,
	isTinyPgErrorWithQueryContext,
} from '../types';
import {
	DatabaseError,
	InputValidationError,
	InternalValidationError,
} from '../errors';
import type { Request, Response, NextFunction } from 'express';
import type { Result } from 'tinypg';
import type { JSONSchemaType } from 'ajv';
import type { Applicant } from '../types';

const logger = getLogger(__filename);

const getApplicants = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	db.sql('applicants.selectAll')
		.then((applicantsQueryResult: Result<Applicant>) => {
			logger.debug(applicantsQueryResult);
			const { rows: applicants } = applicantsQueryResult;
			if (isApplicantArray(applicants)) {
				res.status(200).contentType('application/json').send(applicants);
			} else {
				next(
					new InternalValidationError(
						'The database responded with an unexpected format.',
						isApplicantArray.errors ?? [],
					),
				);
			}
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving applicants.', error));
				return;
			}
			next(error);
		});
};

const postApplicantsBodySchema: JSONSchemaType<
	Omit<Applicant, 'createdAt' | 'id' | 'optedIn'>
> = {
	type: 'object',
	properties: {
		externalId: {
			type: 'string',
		},
	},
	required: ['externalId'],
};
const isPostApplicantsBody = ajv.compile(postApplicantsBodySchema);
const postApplicants = (
	req: Request<
		unknown,
		unknown,
		Omit<Applicant, 'createdAt' | 'id' | 'optedIn'>
	>,
	res: Response,
	next: NextFunction,
): void => {
	if (!isPostApplicantsBody(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isPostApplicantsBody.errors ?? [],
			),
		);
	}

	db.sql('applicants.insertOne', {
		...req.body,
		optedIn: false,
	})
		.then((applicantsQueryResult: Result<Applicant>) => {
			logger.debug(applicantsQueryResult);
			const baseField = applicantsQueryResult.rows[0];
			if (isApplicant(baseField)) {
				res.status(201).contentType('application/json').send(baseField);
			} else {
				next(
					new InternalValidationError(
						'The database responded with an unexpected format.',
						isApplicant.errors ?? [],
					),
				);
			}
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error creating applicant.', error));
				return;
			}
			next(error);
		});
};

export const applicantsHandlers = {
	getApplicants,
	postApplicants,
};
