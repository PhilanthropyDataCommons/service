import { HTTP_STATUS } from '../constants';
import {
	createPermissionGrant,
	getDatabase,
	createProposal,
	getLimitValues,
	hasOpportunityPermission,
	loadProposal,
	loadProposalBundle,
	loadOpportunity,
} from '../database';
import {
	getSelfManageGrantPartial,
	isId,
	isAuthContext,
	isWritableProposal,
	PermissionGrantEntityType,
	PermissionGrantVerb,
} from '../types';
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
	extractFunderParameters,
} from '../queryParameters';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';

const getProposals = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { search } = extractSearchParameters(req);
	const { changemakerId } = extractChangemakerParameters(req);
	const { funderShortCode } = extractFunderParameters(req);
	const { createdBy } = extractCreatedByParameters(req);

	const proposalBundle = await loadProposalBundle(
		db,
		req,
		createdBy,
		changemakerId,
		funderShortCode,
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
	const db = getDatabase();

	const { proposalId } = coerceParams(req.params);
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
	const db = getDatabase();

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
			!(await hasOpportunityPermission(db, req, {
				opportunityId: opportunity.id,
				permission: PermissionGrantVerb.CREATE,
				scope: PermissionGrantEntityType.PROPOSAL,
			}))
		) {
			throw new UnprocessableEntityError(
				'You do not have permission to create a proposal for this opportunity.',
			);
		}
		const committedProposal = await db.transaction(async (txDb) => {
			const proposal = await createProposal(txDb, req, {
				opportunityId,
				externalId,
			});
			await createPermissionGrant(txDb, req, {
				...getSelfManageGrantPartial(req),
				contextEntityType: PermissionGrantEntityType.PROPOSAL,
				proposalId: proposal.id,
			});
			return proposal;
		});
		res
			.status(HTTP_STATUS.SUCCESSFUL.CREATED)
			.contentType('application/json')
			.send(committedProposal);
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
