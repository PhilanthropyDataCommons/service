import {
	db,
	createChangemakerProposal,
	getLimitValues,
	loadChangemakerProposalBundle,
} from '../database';
import {
	isTinyPgErrorWithQueryContext,
	isWritableChangemakerProposal,
} from '../types';
import { DatabaseError, InputValidationError } from '../errors';
import {
	extractChangemakerParameters,
	extractProposalParameters,
	extractPaginationParameters,
} from '../queryParameters';
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
	if (!isWritableChangemakerProposal(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableChangemakerProposal.errors ?? [],
			),
		);
		return;
	}

	(async () => {
		const changemakerProposal = await createChangemakerProposal(
			db,
			null,
			req.body,
		);
		res.status(201).contentType('application/json').send(changemakerProposal);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error creating changemaker proposal.', error));
			return;
		}
		next(error);
	});
};

export const changemakerProposalsHandlers = {
	getChangemakerProposals,
	postChangemakerProposal,
};
