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
	isTinyPgErrorWithQueryContext,
	isWritableChangemakerProposal,
	Permission,
} from '../types';
import {
	DatabaseError,
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
import type { Request, Response, NextFunction } from 'express';

const getChangemakerProposals = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { changemakerId } = extractChangemakerParameters(req);
	const { proposalId } = extractProposalParameters(req);

	(async () => {
		const changemakerProposalBundle = await loadChangemakerProposalBundle(
			db,
			null,
			changemakerId,
			proposalId,
			limit,
			offset,
		);
		res
			.status(200)
			.contentType('application/json')
			.send(changemakerProposalBundle);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error retrieving changemaker proposals.', error));
			return;
		}
		next(error);
	});
};

const postChangemakerProposal = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	if (!isWritableChangemakerProposal(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableChangemakerProposal.errors ?? [],
			),
		);
		return;
	}
	const { proposalId, changemakerId } = req.body;

	(async () => {
		const proposal = await loadProposal(db, null, proposalId);
		const opportunity = await loadOpportunity(db, null, proposal.opportunityId);
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
		res.status(201).contentType('application/json').send(changemakerProposal);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error creating changemaker proposal.', error));
			return;
		}
		if (error instanceof NotFoundError) {
			next(
				new UnprocessableEntityError(
					`related ${error.details.entityType} not found.`,
				),
			);
			return;
		}
		next(error);
	});
};

export const changemakerProposalsHandlers = {
	getChangemakerProposals,
	postChangemakerProposal,
};
