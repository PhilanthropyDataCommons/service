import { getLogger } from '../logger';
import { db } from '../database';
import {
	isApplicationForm,
	isApplicationFormField,
	isProposal,
	isProposalVersionWrite,
	isProposalVersion,
	isProposalFieldValue,
	isTinyPgErrorWithQueryContext,
} from '../types';
import {
	DatabaseError,
	InternalValidationError,
	InputValidationError,
	InputConflictError,
} from '../errors';
import type { Request, Response, NextFunction } from 'express';
import type {
	ApplicationForm,
	ApplicationFormField,
	Proposal,
	ProposalVersion,
	ProposalVersionWrite,
	ProposalFieldValue,
	ProposalFieldValueWrite,
} from '../types';

const logger = getLogger(__filename);

const assertApplicationFormExistsForProposal = async (
	applicationFormId: number,
	proposalId: number,
): Promise<void> => {
	const applicationFormsQueryResult = await db.sql<ApplicationForm>(
		'applicationForms.selectById',
		{ id: applicationFormId },
	);
	const applicationForm = applicationFormsQueryResult.rows[0];
	if (applicationForm === undefined) {
		throw new InputConflictError('The Application Form does not exist.', {
			entityType: 'ApplicationForm',
			entityId: applicationFormId,
		});
	}
	if (!isApplicationForm(applicationForm)) {
		throw new InternalValidationError(
			'The database responded with an unexpected format when looking up the Application Form.',
			isApplicationForm.errors ?? [],
		);
	}

	const proposalsQueryResult = await db.sql<Proposal>('proposals.selectById', {
		id: proposalId,
	});
	const proposal = proposalsQueryResult.rows[0];
	if (proposal === undefined) {
		throw new InputConflictError('The Proposal does not exist.', {
			entityType: 'Proposal',
			entityId: proposalId,
		});
	}
	if (!isProposal(proposal)) {
		throw new InternalValidationError(
			'The database responded with an unexpected format when looking up the Proposal.',
			isProposal.errors ?? [],
		);
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
		async (proposalFieldValue) =>
			db
				.sql<ApplicationFormField>('applicationFormFields.selectById', {
					id: proposalFieldValue.applicationFormFieldId,
				})
				.then((applicationFormFieldQueryResult) => {
					const { applicationFormFieldId } = proposalFieldValue;
					const applicationFormField = applicationFormFieldQueryResult.rows[0];
					if (applicationFormField === undefined) {
						throw new InputConflictError(
							'The Application Form Field does not exist.',
							{
								entityType: 'ApplicationFormField',
								entityId: applicationFormFieldId,
							},
						);
					}
					if (!isApplicationFormField(applicationFormField)) {
						throw new InternalValidationError(
							'The database responded with an unexpected format when looking up the Application Form Field.',
							isApplicationFormField.errors ?? [],
						);
					}
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
				}),
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
				if (isProposalVersion(proposalVersion)) {
					const proposalFieldValueQueries = req.body.fieldValues.map(
						async (fieldValue) =>
							transactionDb.sql<ProposalFieldValue>(
								'proposalFieldValues.insertOne',
								{
									...fieldValue,
									proposalVersionId: proposalVersion.id,
								},
							),
					);
					const proposalFieldValueResults = await Promise.all(
						proposalFieldValueQueries,
					);
					const proposalFieldValues = proposalFieldValueResults.map(
						(proposalFieldValueResult) => {
							const proposalFieldValue = proposalFieldValueResult.rows[0];
							if (isProposalFieldValue(proposalFieldValue)) {
								return proposalFieldValue;
							}
							throw new InternalValidationError(
								'The database responded with an unexpected format when creating the Proposal Field Value.',
								isProposalFieldValue.errors ?? [],
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
					isProposalVersion.errors ?? [],
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
