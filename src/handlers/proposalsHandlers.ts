import {
	db,
	createProposal,
	getLimitValues,
	loadProposal,
	loadProposalBundle,
	loadOpportunity,
} from '../database';
import {
	isId,
	isAuthContext,
	isTinyPgErrorWithQueryContext,
	isWritableProposal,
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
	extractCreatedByParameters,
	extractChangemakerParameters,
	extractPaginationParameters,
	extractSearchParameters,
} from '../queryParameters';
import { authContextHasFunderPermission } from '../authorization';
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
		const proposal = await loadProposal(db, req, proposalId);
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
		const opportunity = await loadOpportunity(db, null, opportunityId);
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
		if (error instanceof NotFoundError) {
			next(
				new UnprocessableEntityError(
					`The associated ${error.details.entityType} was not found.`,
				),
			);
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
