import { getLogger } from '../logger';
import {
	db,
	loadApplicationForm,
	loadApplicationFormField,
	loadProposal,
} from '../database';
import {
	isProposalVersionWrite,
	isTinyPgErrorWithQueryContext,
} from '../types';
import {
	DatabaseError,
	InternalValidationError,
	InputValidationError,
	InputConflictError,
	NotFoundError,
} from '../errors';
import { fieldValueIsValid } from '../fieldValidation';
import type { Request, Response, NextFunction } from 'express';
import type {
	ProposalVersion,
	ProposalVersionWrite,
	ProposalFieldValue,
	ProposalFieldValueWrite,
	Proposal,
	ApplicationForm,
} from '../types';

const logger = getLogger(__filename);

const assertApplicationFormExistsForProposal = async (
	applicationFormId: number,
	proposalId: number,
): Promise<void> => {
	let applicationForm: ApplicationForm;
	try {
		applicationForm = await loadApplicationForm(applicationFormId);
	} catch {
		throw new InputConflictError('The Application Form does not exist.', {
			entityType: 'ApplicationForm',
			entityId: applicationFormId,
		});
	}

	let proposal: Proposal;
	try {
		proposal = await loadProposal(proposalId);
	} catch (err) {
		if (err instanceof NotFoundError) {
			throw new InputConflictError(
				`The specified Proposal does not exist (${proposalId}).`,
				{
					entityType: 'Proposal',
					entityId: proposalId,
					contextEntityType: 'ApplicationForm',
					contextEntityId: applicationFormId,
				},
			);
		}
		throw err;
	}

	if (proposal.opportunityId !== applicationForm.opportunityId) {
		throw new InputConflictError(
			`The Application Form (${applicationFormId}) does not exist for the opportunity associated with the specified Proposal (${proposalId}).`,
			{
				entityType: 'ApplicationForm',
				entityId: applicationFormId,
				contextEntityType: 'Proposal',
				contextEntityId: proposalId,
			},
		);
	}
};

const assertProposalFieldValuesMapToApplicationForm = async (
	applicationFormId: number,
	proposalFieldValues: ProposalFieldValueWrite[],
): Promise<void> => {
	const applicationFormFieldQueries = proposalFieldValues.map(
		async (proposalFieldValue) => {
			const { applicationFormFieldId } = proposalFieldValue;
			try {
				const applicationFormField = await loadApplicationFormField(
					proposalFieldValue.applicationFormFieldId,
				);
				if (applicationFormField.applicationFormId !== applicationFormId) {
					throw new InputConflictError(
						`Application Form Field (${applicationFormFieldId}) does not exist in Application Form (${applicationFormId}).`,
						{
							entityType: 'ApplicationForm',
							entityId: applicationFormId,
							contextEntityType: 'ApplicationFormField',
							contextEntityId: applicationFormFieldId,
						},
					);
				}
			} catch (error) {
				if (error instanceof NotFoundError) {
					throw new InputConflictError(
						'The Application Form Field does not exist.',
						{
							entityType: 'ApplicationFormField',
							entityId: applicationFormFieldId,
						},
					);
				}
				throw error;
			}
		},
	);
	await Promise.all(applicationFormFieldQueries);
};

const postProposalVersion = (
	req: Request<unknown, unknown, ProposalVersionWrite>,
	res: Response,
	next: NextFunction,
): void => {
	if (!isProposalVersionWrite(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isProposalVersionWrite.errors ?? [],
			),
		);
		return;
	}

	Promise.all([
		assertApplicationFormExistsForProposal(
			req.body.applicationFormId,
			req.body.proposalId,
		),
		assertProposalFieldValuesMapToApplicationForm(
			req.body.applicationFormId,
			req.body.fieldValues,
		),
	])
		.then(() => {
			db.transaction(async (transactionDb) => {
				const proposalVersionQueryResult =
					await transactionDb.sql<ProposalVersion>(
						'proposalVersions.insertOne',
						req.body,
					);
				logger.debug(proposalVersionQueryResult);
				const proposalVersion = proposalVersionQueryResult.rows[0];
				if (proposalVersion !== undefined) {
					const proposalFieldValueQueries = req.body.fieldValues.map(
						async (fieldValue) => {
							const { value, applicationFormFieldId, position } = fieldValue;
							const applicationFormField = await loadApplicationFormField(
								applicationFormFieldId,
							);
							const isValid = fieldValueIsValid(
								value,
								applicationFormField.baseField.dataType,
							);
							return transactionDb.sql<ProposalFieldValue>(
								'proposalFieldValues.insertOne',
								{
									proposalVersionId: proposalVersion.id,
									applicationFormFieldId,
									value,
									position,
									isValid,
								},
							);
						},
					);
					const proposalFieldValueResults = await Promise.all(
						proposalFieldValueQueries,
					);
					const proposalFieldValues = proposalFieldValueResults.map(
						(proposalFieldValueResult) => {
							const proposalFieldValue = proposalFieldValueResult.rows[0];
							if (proposalFieldValue !== undefined) {
								return proposalFieldValue;
							}
							throw new InternalValidationError(
								'The database responded with an unexpected format when creating the Proposal Field Value.',
								[],
							);
						},
					);

					return {
						...proposalVersion,
						fieldValues: proposalFieldValues,
					};
				}
				throw new InternalValidationError(
					'The database responded with an unexpected format when creating the Proposal Version.',
					[],
				);
			})
				.then((proposalVersion) => {
					res.status(201).contentType('application/json').send(proposalVersion);
				})
				.catch((error: unknown) => {
					if (isTinyPgErrorWithQueryContext(error)) {
						next(new DatabaseError('Error creating proposal version.', error));
						return;
					}
					next(error);
				});
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(
					new DatabaseError(
						'Something went wrong when asserting the validity of the provided Proposal Version.',
						error,
					),
				);
				return;
			}
			next(error);
		});
};

export const proposalVersionsHandlers = {
	postProposalVersion,
};
