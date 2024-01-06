import { getLogger } from '../logger';
import {
	db,
	getLimitValues,
	loadProposalBundle,
	enrichProposals,
} from '../database';
import {
	isProposalWrite,
	isProposal,
	isProposalVersionArray,
	isTinyPgErrorWithQueryContext,
	isProposalFieldValueArray,
	isApplicationFormFieldArray,
} from '../types';
import {
	DatabaseError,
	InternalValidationError,
	InputValidationError,
	NotFoundError,
} from '../errors';
import {
	extractPaginationParameters,
	extractSearchParameters,
} from '../queryParameters';
import type { Request, Response, NextFunction } from 'express';
import type { Result } from 'tinypg';
import type {
	ApplicationFormField,
	Proposal,
	ProposalFieldValue,
	ProposalWrite,
	ProposalVersion,
} from '../types';

const logger = getLogger(__filename);

const getProposals = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const paginationParameters = extractPaginationParameters(req);
	const searchParameters = extractSearchParameters(req);
	(async () => {
		const proposalBundle = await loadProposalBundle({
			...getLimitValues(paginationParameters),
			...searchParameters,
		});
		const enrichedProposalBundle = {
			...proposalBundle,
			entries: await enrichProposals(proposalBundle.entries),
		};

		res
			.status(200)
			.contentType('application/json')
			.send(enrichedProposalBundle);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error retrieving proposals.', error));
			return;
		}
		next(error);
	});
};

export const joinProposalFieldValuesToProposalVersion = (
	proposalVersion: ProposalVersion,
	values: ProposalFieldValue[],
): ProposalVersion => {
	const newVersion = structuredClone(proposalVersion);
	values.forEach((proposalFieldValue) => {
		if (newVersion.fieldValues === undefined) {
			newVersion.fieldValues = [];
		}
		if (proposalFieldValue.proposalVersionId === newVersion.id) {
			newVersion.fieldValues.push(proposalFieldValue);
		}
	});
	return newVersion;
};

export const joinApplicationFormFieldsToProposalFieldValues = (
	values: ProposalFieldValue[],
	fields: ApplicationFormField[],
): ProposalFieldValue[] => {
	const newValues = structuredClone(values);
	if (newValues.length !== fields.length) {
		// It is invalid to try to zip values and fields of unequal length.
		throw new Error(
			`Given arrays must be of equal length. ${values.length} !== ${fields.length}`,
		);
	}

	return newValues.map((value, index) => {
		// Look in the fields array at the same index as the values array.
		const field = fields[index];
		if (field === undefined) {
			throw new Error(
				`Expected only defined fields and values, copiedFields[${index}] was undefined`,
			);
		}
		if (value.applicationFormFieldId !== field.id) {
			throw new Error(
				`Given values and fields must be sorted such that they correspond. index=${index}: ${value.applicationFormFieldId} !== ${field.id}.`,
			);
		}
		// When all is well, add the field to the value.
		return { ...value, applicationFormField: field };
	});
};

const getProposalWithFieldsAndValues = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	// All queries could technically be sent concurrently but start with a proposal query to confirm
	// there is a proposal first before sending the others concurrently.
	db.sql('proposals.selectById', { id: req.params.id })
		.then((proposalsQueryResult: Result<Proposal>) => {
			if (proposalsQueryResult.row_count === 0) {
				throw new NotFoundError(
					'Not found. Find existing proposals by calling with no parameters.',
				);
			}
			const baseProposal = proposalsQueryResult.rows[0];
			if (!isProposal(baseProposal)) {
				throw new InternalValidationError(
					'The database responded with an unexpected format.',
					isProposal.errors ?? [],
				);
			}
			// Run the remaining queries concurrently.
			Promise.all([
				db.sql('proposalFieldValues.selectByProposalId', {
					proposalId: req.params.id,
				}),
				db.sql('applicationFormFields.selectByProposalId', {
					proposalId: req.params.id,
				}),
				db.sql('proposalVersions.selectByProposalId', {
					proposalId: req.params.id,
				}),
			])
				.then(
					([
						proposalFieldValuesQueryResult,
						applicationFormFieldsQueryResult,
						proposalVersionsQueryResult,
					]) => {
						if (
							!isProposalFieldValueArray(proposalFieldValuesQueryResult.rows)
						) {
							throw new InternalValidationError(
								'The database responded with an unexpected format.',
								isProposalFieldValueArray.errors ?? [],
							);
						}
						if (
							!isApplicationFormFieldArray(
								applicationFormFieldsQueryResult.rows,
							)
						) {
							throw new InternalValidationError(
								'The database responded with an unexpected format.',
								isApplicationFormFieldArray.errors ?? [],
							);
						}
						if (!isProposalVersionArray(proposalVersionsQueryResult.rows)) {
							throw new InternalValidationError(
								'The database responded with an unexpected format.',
								isProposalVersionArray.errors ?? [],
							);
						}
						const valuesWithFields =
							joinApplicationFormFieldsToProposalFieldValues(
								proposalFieldValuesQueryResult.rows,
								applicationFormFieldsQueryResult.rows,
							);
						const versions = proposalVersionsQueryResult.rows.map((proposal) =>
							joinProposalFieldValuesToProposalVersion(
								proposal,
								valuesWithFields,
							),
						);
						const proposal = { ...baseProposal, versions };
						res.status(200).contentType('application/json').send(proposal);
					},
				)
				.catch((error: unknown) => {
					if (isTinyPgErrorWithQueryContext(error)) {
						next(new DatabaseError('Error retrieving proposal.', error));
						return;
					}
					next(error);
				});
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving proposal.', error));
				return;
			}
			next(error);
		});
};

const getProposalShallow = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	db.sql('proposals.selectById', { id: req.params.id })
		.then((proposalsQueryResult: Result<Proposal>) => {
			logger.debug(proposalsQueryResult);
			if (proposalsQueryResult.row_count === 0) {
				throw new NotFoundError(
					'Not found. Find existing proposals by calling with no parameters.',
				);
			}
			const proposal = proposalsQueryResult.rows[0];
			if (isProposal(proposal)) {
				res.status(200).contentType('application/json').send(proposal);
			} else {
				next(
					new InternalValidationError(
						'The database responded with an unexpected format.',
						isProposal.errors ?? [],
					),
				);
			}
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving proposals.', error));
				return;
			}
			next(error);
		});
};

const getProposal = (req: Request, res: Response, next: NextFunction): void => {
	if (
		req.query.includeFieldsAndValues !== undefined &&
		req.query.includeFieldsAndValues === 'true'
	) {
		getProposalWithFieldsAndValues(req, res, next);
	} else {
		getProposalShallow(req, res, next);
	}
};

const postProposal = (
	req: Request<unknown, unknown, ProposalWrite>,
	res: Response,
	next: NextFunction,
): void => {
	if (!isProposalWrite(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isProposalWrite.errors ?? [],
			),
		);
		return;
	}

	db.sql('proposals.insertOne', req.body)
		.then((proposalQueryResult: Result<Proposal>) => {
			logger.debug(proposalQueryResult);
			const proposal = proposalQueryResult.rows[0];
			if (isProposal(proposal)) {
				res.status(201).contentType('application/json').send(proposal);
			} else {
				next(
					new InternalValidationError(
						'The database responded with an unexpected format when creating the proposal.',
						isProposal.errors ?? [],
					),
				);
			}
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error creating proposal.', error));
				return;
			}
			next(error);
		});
};

export const proposalsHandlers = {
	getProposal,
	getProposals,
	postProposal,
};
