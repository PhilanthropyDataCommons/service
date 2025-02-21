import {
	db,
	assertProposalAuthorization,
	createProposal,
	getLimitValues,
	loadProposal,
	loadProposalBundle,
} from '../database';
import {
	isId,
	isAuthContext,
	isTinyPgErrorWithQueryContext,
	isWritableProposal,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
} from '../errors';
import {
	extractCreatedByParameters,
	extractChangemakerParameters,
	extractPaginationParameters,
	extractSearchParameters,
} from '../queryParameters';
import type { Request, Response, NextFunction } from 'express';

const getProposals = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { search } = extractSearchParameters(req);
	const { changemakerId } = extractChangemakerParameters(req);
	const { createdBy } = extractCreatedByParameters(req);

	(async () => {
		const proposalBundle = await loadProposalBundle(
			db,
			req,
			createdBy,
			changemakerId,
			search,
			limit,
			offset,
		);

		res.status(200).contentType('application/json').send(proposalBundle);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error retrieving proposals.', error));
			return;
		}
		next(error);
	});
};

const getProposal = (req: Request, res: Response, next: NextFunction): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	const { proposalId } = req.params;
	if (!isId(proposalId)) {
		next(new InputValidationError('Invalid id parameter.', isId.errors ?? []));
		return;
	}
	(async () => {
		await assertProposalAuthorization(proposalId, req);
		const proposal = await loadProposal(db, null, proposalId);
		res.status(200).contentType('application/json').send(proposal);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error loading the proposal.', error));
			return;
		}
		next(error);
	});
};

const postProposal = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	if (!isWritableProposal(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableProposal.errors ?? [],
			),
		);
		return;
	}

	const { externalId, opportunityId } = req.body;
	const createdBy = req.user.keycloakUserId;

	(async () => {
		const proposal = await createProposal(db, null, {
			opportunityId,
			externalId,
			createdBy,
		});
		res.status(201).contentType('application/json').send(proposal);
	})().catch((error: unknown) => {
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
