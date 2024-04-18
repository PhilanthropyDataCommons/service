import {
	assertProposalAuthorization,
	createProposal,
	getLimitValues,
	loadProposal,
	loadProposalBundle,
} from '../database';
import {
	AuthenticatedRequest,
	isId,
	isTinyPgErrorWithQueryContext,
	isWritableProposal,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
} from '../errors';
import {
	extractOrganizationParameters,
	extractPaginationParameters,
	extractSearchParameters,
} from '../queryParameters';
import type { Response, NextFunction } from 'express';

const getProposals = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void => {
	if (req.user === undefined) {
		next(new FailedMiddlewareError('Unexpected lack of user context.'));
		return;
	}
	const { user } = req;
	const paginationParameters = extractPaginationParameters(req);
	const searchParameters = extractSearchParameters(req);
	const organizationParameters = extractOrganizationParameters(req);
	(async () => {
		const proposalBundle = await loadProposalBundle({
			...getLimitValues(paginationParameters),
			...searchParameters,
			...organizationParameters,
			createdBy: user.id,
		});

		res.status(200).contentType('application/json').send(proposalBundle);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error retrieving proposals.', error));
			return;
		}
		next(error);
	});
};

const getProposal = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void => {
	const { user } = req;
	const { proposalId } = req.params;
	if (user === undefined) {
		next(new FailedMiddlewareError('Unexpected lack of user context.'));
		return;
	}
	if (!isId(proposalId)) {
		next(new InputValidationError('Invalid id parameter.', isId.errors ?? []));
		return;
	}
	(async () => {
		await assertProposalAuthorization(proposalId, user.id);
		const proposal = await loadProposal(proposalId);
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
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void => {
	if (req.user === undefined) {
		next(new FailedMiddlewareError('Unexpected lack of user context.'));
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
	const createdBy = req.user.id;

	createProposal({
		opportunityId,
		externalId,
		createdBy,
	})
		.then((proposal) => {
			res.status(201).contentType('application/json').send(proposal);
		})
		.catch((error: unknown) => {
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
