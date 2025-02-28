import {
	assertSourceExists,
	createProposalFieldValue,
	createProposalVersion,
	db,
	loadApplicationForm,
	loadApplicationFormField,
	loadOpportunity,
	loadProposal,
	loadProposalVersion,
} from '../database';
import {
	isAuthContext,
	isTinyPgErrorWithQueryContext,
	isWritableProposalVersionWithFieldValues,
	isId,
	Permission,
} from '../types';
import {
	DatabaseError,
	InputValidationError,
	InputConflictError,
	NotFoundError,
	FailedMiddlewareError,
	UnprocessableEntityError,
} from '../errors';
import { fieldValueIsValid } from '../fieldValidation';
import { authContextHasFunderPermission } from '../authorization';
import type { Request, Response, NextFunction } from 'express';
import type {
	Proposal,
	ApplicationForm,
	WritableProposalFieldValueWithProposalVersionContext,
	AuthContext,
} from '../types';

const assertApplicationFormExistsForProposal = async (
	authContext: AuthContext,
	applicationFormId: number,
	proposalId: number,
): Promise<void> => {
	let applicationForm: ApplicationForm;
	try {
		applicationForm = await loadApplicationForm(
			db,
			authContext,
			applicationFormId,
		);
	} catch {
		throw new InputConflictError('The Application Form does not exist.', {
			entityType: 'ApplicationForm',
			entityId: applicationFormId,
		});
	}

	let proposal: Proposal;
	try {
		proposal = await loadProposal(db, null, proposalId);
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
					db,
					null,
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
	const createdBy = req.user.keycloakUserId;

	(async () => {
		const proposal = await loadProposal(db, req, proposalId);
		const opportunity = await loadOpportunity(db, req, proposal.opportunityId);
		if (
			!authContextHasFunderPermission(
				req,
				opportunity.funderShortCode,
				Permission.EDIT,
			)
		) {
			throw new UnprocessableEntityError(
				'You do not have write permissions on this proposal.',
			);
		}
		await Promise.all([
			assertApplicationFormExistsForProposal(
				req,
				applicationFormId,
				proposalId,
			),
			assertProposalFieldValuesMapToApplicationForm(
				applicationFormId,
				fieldValues,
			),
			assertSourceExists(sourceId),
		]);
		await db.transaction(async (transactionDb) => {
			const proposalVersion = await createProposalVersion(transactionDb, req, {
				proposalId,
				applicationFormId,
				sourceId,
				createdBy,
			});
			const proposalFieldValues = await Promise.all(
				fieldValues.map(async (fieldValue) => {
					const { value, applicationFormFieldId } = fieldValue;
					const applicationFormField = await loadApplicationFormField(
						db,
						req,
						applicationFormFieldId,
					);
					const isValid = fieldValueIsValid(
						value,
						applicationFormField.baseField.dataType,
					);
					const proposalFieldValue = await createProposalFieldValue(
						transactionDb,
						req,
						{
							...fieldValue,
							proposalVersionId: proposalVersion.id,
							isValid,
						},
					);
					return proposalFieldValue;
				}),
			);
			res
				.status(201)
				.contentType('application/json')
				.send({
					...proposalVersion,
					fieldValues: proposalFieldValues,
				});
		});
	})().catch((error: unknown) => {
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
			if (error.details.entityType === 'Proposal') {
				next(
					new InputConflictError(`The related entity does not exist`, {
						entityType: 'Proposal',
						entityId: proposalId,
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

const getProposalVersion = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const { proposalVersionId } = req.params;
	if (!isId(proposalVersionId)) {
		next(
			new InputValidationError('Invalid query parameter.', isId.errors ?? []),
		);
		return;
	}
	loadProposalVersion(db, null, proposalVersionId)
		.then((item) => {
			res.status(200).contentType('application/json').send(item);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving item.', error));
				return;
			}
			next(error);
		});
};

export const proposalVersionsHandlers = {
	postProposalVersion,
	getProposalVersion,
};
