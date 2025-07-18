import { HTTP_STATUS } from '../constants';
import {
	db,
	createChangemakerProposal,
	getLimitValues,
	loadChangemakerProposalBundle,
	loadProposal,
	loadOpportunity,
} from '../database';
import {
	isAuthContext,
	isWritableChangemakerProposal,
	Permission,
} from '../types';
import {
	FailedMiddlewareError,
	InputValidationError,
	NotFoundError,
	UnprocessableEntityError,
} from '../errors';
import {
	extractChangemakerParameters,
	extractProposalParameters,
	extractPaginationParameters,
} from '../queryParameters';
import { authContextHasFunderPermission } from '../authorization';
import type { Request, Response } from 'express';

const getChangemakerProposals = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { changemakerId } = extractChangemakerParameters(req);
	const { proposalId } = extractProposalParameters(req);

	const changemakerProposalBundle = await loadChangemakerProposalBundle(
		db,
		req,
		changemakerId,
		proposalId,
		limit,
		offset,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(changemakerProposalBundle);
};

const postChangemakerProposal = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const body = req.body as unknown;
	if (!isWritableChangemakerProposal(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableChangemakerProposal.errors ?? [],
		);
	}

	const { proposalId, changemakerId } = body;
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
				'You do not have write permissions on the funder associated with this proposal.',
			);
		}
		const changemakerProposal = await createChangemakerProposal(db, null, {
			changemakerId,
			proposalId,
		});
		res
			.status(HTTP_STATUS.SUCCESSFUL.CREATED)
			.contentType('application/json')
			.send(changemakerProposal);
	} catch (error: unknown) {
		if (error instanceof NotFoundError) {
			throw new UnprocessableEntityError(
				`related ${error.details.entityType} not found.`,
			);
		}
		throw error;
	}
};

export const changemakerProposalsHandlers = {
	getChangemakerProposals,
	postChangemakerProposal,
};
