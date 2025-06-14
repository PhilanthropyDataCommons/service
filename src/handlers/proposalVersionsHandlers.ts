import {
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
	isWritableProposalVersionWithFieldValues,
	isId,
	Permission,
} from '../types';
import {
	InputValidationError,
	InputConflictError,
	NotFoundError,
	FailedMiddlewareError,
	UnprocessableEntityError,
} from '../errors';
import { fieldValueIsValid } from '../fieldValidation';
import { authContextHasFunderPermission } from '../authorization';
import { allNoLeaks } from '../promises';
import type { Request, Response } from 'express';
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
		proposal = await loadProposal(db, authContext, proposalId);
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
	await allNoLeaks(applicationFormFieldQueries);
};

const postProposalVersion = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	if (!isWritableProposalVersionWithFieldValues(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableProposalVersionWithFieldValues.errors ?? [],
		);
	}

	const { sourceId, fieldValues, proposalId, applicationFormId } = req.body;

	try {
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
		await assertApplicationFormExistsForProposal(
			req,
			applicationFormId,
			proposalId,
		);
		await assertProposalFieldValuesMapToApplicationForm(
			applicationFormId,
			fieldValues,
		);
		const finalProposalVersion = await db.transaction(async (transactionDb) => {
			const proposalVersion = await createProposalVersion(transactionDb, req, {
				proposalId,
				applicationFormId,
				sourceId,
			});
			const proposalFieldValues = await allNoLeaks(
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
			return {
				...proposalVersion,
				fieldValues: proposalFieldValues,
			};
		});
		res.status(201).contentType('application/json').send(finalProposalVersion);
	} catch (error: unknown) {
		if (error instanceof NotFoundError) {
			if (error.details.entityType === 'Source') {
				throw new InputConflictError(`The related entity does not exist`, {
					entityType: 'Source',
					entityId: sourceId,
				});
			}
			if (error.details.entityType === 'Proposal') {
				throw new InputConflictError(`The related entity does not exist`, {
					entityType: 'Proposal',
					entityId: proposalId,
				});
			}
		}
		throw error;
	}
};

const getProposalVersion = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const { proposalVersionId } = req.params;
	if (!isId(proposalVersionId)) {
		throw new InputValidationError(
			'Invalid query parameter.',
			isId.errors ?? [],
		);
	}
	const proposalVersion = await loadProposalVersion(db, req, proposalVersionId);
	res.status(200).contentType('application/json').send(proposalVersion);
};

export const proposalVersionsHandlers = {
	postProposalVersion,
	getProposalVersion,
};
