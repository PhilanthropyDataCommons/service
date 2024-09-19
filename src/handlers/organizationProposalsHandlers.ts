import {
	createOrganizationProposal,
	getLimitValues,
	loadOrganizationProposalBundle,
} from '../database';
import {
	isTinyPgErrorWithQueryContext,
	isWritableOrganizationProposal,
} from '../types';
import { DatabaseError, InputValidationError } from '../errors';
import {
	extractOrganizationParameters,
	extractProposalParameters,
	extractPaginationParameters,
} from '../queryParameters';
import type { Request, Response, NextFunction } from 'express';

const getOrganizationProposals = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { organizationId } = extractOrganizationParameters(req);
	const { proposalId } = extractProposalParameters(req);

	(async () => {
		const organizationProposalBundle = await loadOrganizationProposalBundle(
			organizationId,
			proposalId,
			limit,
			offset,
		);
		res
			.status(200)
			.contentType('application/json')
			.send(organizationProposalBundle);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(
				new DatabaseError('Error retrieving organization proposals.', error),
			);
			return;
		}
		next(error);
	});
};

const postOrganizationProposal = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isWritableOrganizationProposal(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableOrganizationProposal.errors ?? [],
			),
		);
		return;
	}

	createOrganizationProposal(req.body)
		.then((organizationProposal) => {
			res
				.status(201)
				.contentType('application/json')
				.send(organizationProposal);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error creating organization proposal.', error));
				return;
			}
			next(error);
		});
};

export const organizationProposalsHandlers = {
	getOrganizationProposals,
	postOrganizationProposal,
};
