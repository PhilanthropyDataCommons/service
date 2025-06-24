import { HTTP_STATUS } from '../constants';
import {
	db,
	createProposal,
	getLimitValues,
	loadProposal,
	loadProposalBundle,
	loadOpportunity,
} from '../database';
import { isId, isAuthContext, isWritableProposal, Permission } from '../types';
import {
	FailedMiddlewareError,
	InputValidationError,
	NotFoundError,
	UnprocessableEntityError,
} from '../errors';
import {
	extractCreatedByParameters,
	extractChangemakerParameters,
	extractPaginationParameters,
	extractSearchParameters,
} from '../queryParameters';
import { authContextHasFunderPermission } from '../authorization';
import type { Request, Response } from 'express';

const getProposals = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { search } = extractSearchParameters(req);
	const { changemakerId } = extractChangemakerParameters(req);
	const { createdBy } = extractCreatedByParameters(req);

	const proposalBundle = await loadProposalBundle(
		db,
		req,
		createdBy,
		changemakerId,
		search,
		limit,
		offset,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(proposalBundle);
};

const getProposal = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const {
		params: { proposalId },
	} = req;
	if (!isId(proposalId)) {
		throw new InputValidationError('Invalid id parameter.', isId.errors ?? []);
	}
	const proposal = await loadProposal(db, req, proposalId);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(proposal);
};

const postProposal = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const body = req.body as unknown;
	if (!isWritableProposal(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableProposal.errors ?? [],
		);
	}

	const { externalId, opportunityId } = body;
	try {
		const opportunity = await loadOpportunity(db, req, opportunityId);
		if (
			!authContextHasFunderPermission(
				req,
				opportunity.funderShortCode,
				Permission.EDIT,
			)
		) {
			throw new UnprocessableEntityError(
				'You do not have write permissions on the funder associated with this opportunity.',
			);
		}
		const proposal = await createProposal(db, req, {
			opportunityId,
			externalId,
		});
		res
			.status(HTTP_STATUS.SUCCESSFUL.CREATED)
			.contentType('application/json')
			.send(proposal);
	} catch (error: unknown) {
		if (error instanceof NotFoundError) {
			throw new UnprocessableEntityError(
				`The associated ${error.details.entityType} was not found.`,
			);
		}
		throw error;
	}
};

export const proposalsHandlers = {
	getProposal,
	getProposals,
	postProposal,
};
