import {
	db,
	getLimitValues,
	loadChangemakerBundle,
	loadChangemaker,
	createChangemaker,
	updateChangemaker,
	createOrUpdateFiscalSponsorship,
	removeFiscalSponsorship,
} from '../database';
import {
	isId,
	isWritableChangemaker,
	isAuthContext,
	getKeycloakUserIdFromAuthContext,
	isPartialWritableChangemaker,
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
} from '../queryParameters';
import type { Request, Response } from 'express';

const postChangemaker = async (req: Request, res: Response) => {
	if (!isWritableChangemaker(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableChangemaker.errors ?? [],
		);
	}
	const changemaker = await createChangemaker(db, null, req.body);
	res.status(201).contentType('application/json').send(changemaker);
};

const getChangemakers = async (req: Request, res: Response) => {
	const paginationParameters = extractPaginationParameters(req);
	const { limit, offset } = getLimitValues(paginationParameters);
	const { proposalId } = extractProposalParameters(req);
	const authContext = isAuthContext(req) ? req : null;
	const changemakerBundle = await loadChangemakerBundle(
		db,
		authContext,
		proposalId,
		limit,
		offset,
	);
	res.status(200).contentType('application/json').send(changemakerBundle);
};

const getChangemaker = async (req: Request, res: Response) => {
	const { changemakerId } = req.params;
	if (!isId(changemakerId)) {
		throw new InputValidationError('Invalid request body.', isId.errors ?? []);
	}
	const authContext = isAuthContext(req) ? req : undefined;
	const changemaker = await loadChangemaker(
		db,
		null,
		getKeycloakUserIdFromAuthContext(authContext),
		changemakerId,
	);
	res.status(200).contentType('application/json').send(changemaker);
};

const patchChangemaker = async (req: Request, res: Response) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const { changemakerId } = req.params;
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
			null,
			req.body,
			changemakerId,
		);
		res.status(200).contentType('application/json').send(changemaker);
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

const putChangemakerFiscalSponsor = async (req: Request, res: Response) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
		return;
	}
	const { changemakerId, fiscalSponsorChangemakerId } = req.params;
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
	res.status(200).contentType('application/json').send(updatedChangemaker);
};

const deleteChangemakerFiscalSponsor = async (req: Request, res: Response) => {
	const { changemakerId, fiscalSponsorChangemakerId } = req.params;
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

	await removeFiscalSponsorship(changemakerId, fiscalSponsorChangemakerId);
	res.status(204).contentType('application/json').send();
};

export const changemakersHandlers = {
	postChangemaker,
	getChangemakers,
	getChangemaker,
	patchChangemaker,
	putChangemakerFiscalSponsor,
	deleteChangemakerFiscalSponsor,
};
