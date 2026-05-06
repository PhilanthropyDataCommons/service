import { HTTP_STATUS } from '../constants';
import {
	createPermissionGrant,
	getDatabase,
	getLimitValues,
	loadChangemakerBundle,
	loadChangemaker,
	createChangemaker,
	updateChangemaker,
	createOrUpdateFiscalSponsorship,
	removeFiscalSponsorship,
} from '../database';
import {
	getSelfManageGrantPartial,
	isId,
	isWritableChangemaker,
	isAuthContext,
	isPartialWritableChangemaker,
	PermissionGrantEntityType,
} from '../types';
import {
	FailedMiddlewareError,
	InputValidationError,
	NoDataReturnedError,
	NotFoundError,
} from '../errors';
import {
	extractPaginationParameters,
	extractProposalParameters,
	extractSearchParameters,
} from '../queryParameters';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';

const postChangemaker = async (req: Request, res: Response): Promise<void> => {
	const db = getDatabase();
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const body = req.body as unknown;
	if (!isWritableChangemaker(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableChangemaker.errors ?? [],
		);
	}
	const committedChangemaker = await db.transaction(async (txDb) => {
		const changemaker = await createChangemaker(txDb, req, body);
		await createPermissionGrant(txDb, req, {
			...getSelfManageGrantPartial(req),
			contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
			changemakerId: changemaker.id,
		});
		return changemaker;
	});
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(committedChangemaker);
};

const getChangemakers = async (req: Request, res: Response): Promise<void> => {
	const db = getDatabase();
	const paginationParameters = extractPaginationParameters(req);
	const { limit, offset } = getLimitValues(paginationParameters);
	const { proposalId } = extractProposalParameters(req);
	const { search } = extractSearchParameters(req);
	const authContext = isAuthContext(req) ? req : null;
	const changemakerBundle = await loadChangemakerBundle(
		db,
		authContext,
		proposalId,
		search,
		limit,
		offset,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(changemakerBundle);
};

const getChangemaker = async (req: Request, res: Response): Promise<void> => {
	const db = getDatabase();
	const { changemakerId } = coerceParams(req.params);
	if (!isId(changemakerId)) {
		throw new InputValidationError('Invalid request body.', isId.errors ?? []);
	}
	const authContext = isAuthContext(req) ? req : null;
	const changemaker = await loadChangemaker(db, authContext, changemakerId);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(changemaker);
};

const patchChangemaker = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { changemakerId } = coerceParams(req.params);
	if (!isId(changemakerId)) {
		throw new InputValidationError(
			'Invalid request parameter.',
			isId.errors ?? [],
		);
	}
	if (!isPartialWritableChangemaker(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isPartialWritableChangemaker.errors ?? [],
		);
	}

	try {
		const changemaker = await updateChangemaker(
			db,
			req,
			req.body,
			changemakerId,
		);
		res
			.status(HTTP_STATUS.SUCCESSFUL.OK)
			.contentType('application/json')
			.send(changemaker);
	} catch (error: unknown) {
		if (error instanceof NoDataReturnedError) {
			// In the case of `PATCH`, when the query succeeds but returns no data,
			// it is more likely to be "ID not found" than a programming error. In
			// the case of a `PUT`, on the other hand, leave it as a 500 because a
			// `PUT` should succeed when all the inputs were valid.
			throw new NotFoundError(
				'The given changemaker was not found.',
				{
					entityType: 'Changemaker',
					entityPrimaryKey: {
						changemakerId,
					},
				},
				{ cause: error },
			);
		}
		throw error;
	}
};

const putChangemakerFiscalSponsor = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { changemakerId, fiscalSponsorChangemakerId } = coerceParams(
		req.params,
	);
	if (!isId(changemakerId)) {
		throw new InputValidationError(
			'Invalid changemakerId parameter.',
			isId.errors ?? [],
		);
	}
	if (!isId(fiscalSponsorChangemakerId)) {
		throw new InputValidationError(
			'Invalid fiscalSponsorChangemakerId parameter.',
			isId.errors ?? [],
		);
	}

	const updatedChangemaker = await createOrUpdateFiscalSponsorship(db, req, {
		fiscalSponseeChangemakerId: changemakerId,
		fiscalSponsorChangemakerId,
	});
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(updatedChangemaker);
};

const deleteChangemakerFiscalSponsor = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const db = getDatabase();
	const { changemakerId, fiscalSponsorChangemakerId } = coerceParams(
		req.params,
	);
	if (!isId(changemakerId)) {
		throw new InputValidationError(
			'Invalid changemakerId parameter.',
			isId.errors ?? [],
		);
	}
	if (!isId(fiscalSponsorChangemakerId)) {
		throw new InputValidationError(
			'Invalid fiscalSponsorChangemakerId parameter.',
			isId.errors ?? [],
		);
	}

	await removeFiscalSponsorship(
		db,
		null,
		changemakerId,
		fiscalSponsorChangemakerId,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT)
		.contentType('application/json')
		.send();
};

export const changemakersHandlers = {
	postChangemaker,
	getChangemakers,
	getChangemaker,
	patchChangemaker,
	putChangemakerFiscalSponsor,
	deleteChangemakerFiscalSponsor,
};
