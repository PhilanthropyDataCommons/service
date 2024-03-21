import {
	createProposal,
	getLimitValues,
	loadProposal,
	loadProposalBundle,
} from '../database';
import { isTinyPgErrorWithQueryContext, isWritableProposal } from '../types';
import { DatabaseError, InputValidationError } from '../errors';
import {
	extractOrganizationParameters,
	extractPaginationParameters,
	extractSearchParameters,
} from '../queryParameters';
import type { Request, Response, NextFunction } from 'express';

const getProposals = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const paginationParameters = extractPaginationParameters(req);
	const searchParameters = extractSearchParameters(req);
	const organizationParameters = extractOrganizationParameters(req);
	(async () => {
		const proposalBundle = await loadProposalBundle({
			...getLimitValues(paginationParameters),
			...searchParameters,
			...organizationParameters,
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
	req: Request<{ id: string }>,
	res: Response,
	next: NextFunction,
): void => {
	const id = Number.parseInt(req.params.id, 10);
	if (Number.isNaN(id)) {
		next(new InputValidationError('The entity id must be a number.', []));
		return;
	}
	loadProposal(id)
		.then((proposal) => {
			res.status(200).contentType('application/json').send(proposal);
		})
		.catch((error: unknown) => {
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
	if (!isWritableProposal(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableProposal.errors ?? [],
			),
		);
		return;
	}

	createProposal(req.body)
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
