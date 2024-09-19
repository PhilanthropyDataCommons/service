import {
	assertSourceExists,
	createProposalFieldValue,
	createProposalVersion,
	db,
	loadApplicationForm,
	loadApplicationFormField,
	loadProposal,
} from '../database';
import {
	isAuthContext,
	isTinyPgErrorWithQueryContext,
	isWritableProposalVersionWithFieldValues,
} from '../types';
import {
	DatabaseError,
	InputValidationError,
	InputConflictError,
	NotFoundError,
	FailedMiddlewareError,
} from '../errors';
import { fieldValueIsValid } from '../fieldValidation';
import type { Request, Response, NextFunction } from 'express';
import type {
	Proposal,
	ApplicationForm,
	WritableProposalFieldValueWithProposalVersionContext,
} from '../types';

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
	proposalFieldValues: WritableProposalFieldValueWithProposalVersionContext[],
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
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	if (!isWritableProposalVersionWithFieldValues(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableProposalVersionWithFieldValues.errors ?? [],
			),
		);
		return;
	}

	const { sourceId, fieldValues, proposalId, applicationFormId } = req.body;
	const createdBy = req.user.id;

	Promise.all([
		assertApplicationFormExistsForProposal(
			req.body.applicationFormId,
			req.body.proposalId,
		),
		assertProposalFieldValuesMapToApplicationForm(
			req.body.applicationFormId,
			req.body.fieldValues,
		),
		assertSourceExists(sourceId),
	])
		.then(() => {
			db.transaction(async (transactionDb) => {
				const proposalVersion = await createProposalVersion(
					{ proposalId, applicationFormId, sourceId, createdBy },
					transactionDb,
				);
				const proposalFieldValues = await Promise.all(
					fieldValues.map(async (fieldValue) => {
						const { value, applicationFormFieldId } = fieldValue;
						const applicationFormField = await loadApplicationFormField(
							applicationFormFieldId,
						);
						const isValid = fieldValueIsValid(
							value,
							applicationFormField.baseField.dataType,
						);
						const proposalFieldValue = await createProposalFieldValue(
							{
								...fieldValue,
								proposalVersionId: proposalVersion.id,
								isValid,
							},
							transactionDb,
						);
						return proposalFieldValue;
					}),
				);
				return {
					...proposalVersion,
					fieldValues: proposalFieldValues,
				};
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
			if (error instanceof NotFoundError) {
				if (error.details.entityType === 'Source') {
					next(
						new InputConflictError(`The related entity does not exist`, {
							entityType: 'Source',
							entityId: sourceId,
						}),
					);
					return;
				}
			}
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
