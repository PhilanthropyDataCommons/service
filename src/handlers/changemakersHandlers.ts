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
	isTinyPgErrorWithQueryContext,
	isAuthContext,
	getKeycloakUserIdFromAuthContext,
	isPartialWritableChangemaker,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
	NoDataReturnedError,
	NotFoundError,
} from '../errors';
import {
	extractPaginationParameters,
	extractProposalParameters,
} from '../queryParameters';
import type { Request, Response, NextFunction } from 'express';

const postChangemaker = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isWritableChangemaker(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableChangemaker.errors ?? [],
			),
		);
		return;
	}
	createChangemaker(db, null, req.body)
		.then((changemaker) => {
			res.status(201).contentType('application/json').send(changemaker);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error creating base field.', error));
				return;
			}
			next(error);
		});
};

const getChangemakers = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const paginationParameters = extractPaginationParameters(req);
	const { limit, offset } = getLimitValues(paginationParameters);
	const { proposalId } = extractProposalParameters(req);
	const authContext = isAuthContext(req) ? req : null;
	loadChangemakerBundle(db, authContext, proposalId, limit, offset)
		.then((changemakerBundle) => {
			res.status(200).contentType('application/json').send(changemakerBundle);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving changemakers.', error));
				return;
			}
			next(error);
		});
};

const getChangemaker = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const { changemakerId } = req.params;
	if (!isId(changemakerId)) {
		next(new InputValidationError('Invalid request body.', isId.errors ?? []));
		return;
	}
	const authContext = isAuthContext(req) ? req : undefined;
	loadChangemaker(
		db,
		null,
		getKeycloakUserIdFromAuthContext(authContext),
		changemakerId,
	)
		.then((changemaker) => {
			res.status(200).contentType('application/json').send(changemaker);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving changemaker.', error));
				return;
			}
			next(error);
		});
};

const patchChangemaker = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	const { changemakerId } = req.params;
	if (!isId(changemakerId)) {
		next(
			new InputValidationError('Invalid request parameter.', isId.errors ?? []),
		);
		return;
	}
	if (!isPartialWritableChangemaker(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isPartialWritableChangemaker.errors ?? [],
			),
		);
		return;
	}

	updateChangemaker(db, null, req.body, changemakerId)
		.then((changemaker) => {
			res.status(200).contentType('application/json').send(changemaker);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error updating changemaker.', error));
				return;
			}
			if (error instanceof NoDataReturnedError) {
				// In the case of `PATCH`, when the query succeeds but returns no data,
				// it is more likely to be "ID not found" than a programming error. In
				// the case of a `PUT`, on the other hand, leave it as a 500 because a
				// `PUT` should succeed when all the inputs were valid.
				next(
					new NotFoundError(
						'The given changemaker was not found.',
						{
							entityType: 'Changemaker',
							entityPrimaryKey: {
								changemakerId,
							},
						},
						{ cause: error },
					),
				);
			}
			next(error);
		});
};

const putChangemakerFiscalSponsor = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	const { changemakerId, fiscalSponsorChangemakerId } = req.params;
	if (!isId(changemakerId)) {
		next(
			new InputValidationError(
				'Invalid changemakerId parameter.',
				isId.errors ?? [],
			),
		);
		return;
	}
	if (!isId(fiscalSponsorChangemakerId)) {
		next(
			new InputValidationError(
				'Invalid fiscalSponsorChangemakerId parameter.',
				isId.errors ?? [],
			),
		);
		return;
	}

	(async () => {
		const updatedChangemaker = await createOrUpdateFiscalSponsorship(db, req, {
			fiscalSponseeChangemakerId: changemakerId,
			fiscalSponsorChangemakerId,
		});
		res.status(200).contentType('application/json').send(updatedChangemaker);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error creating item.', error));
			return;
		}
		next(error);
	});
};

const deleteChangemakerFiscalSponsor = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const { changemakerId, fiscalSponsorChangemakerId } = req.params;
	if (!isId(changemakerId)) {
		next(
			new InputValidationError(
				'Invalid changemakerId parameter.',
				isId.errors ?? [],
			),
		);
		return;
	}
	if (!isId(fiscalSponsorChangemakerId)) {
		next(
			new InputValidationError(
				'Invalid fiscalSponsorChangemakerId parameter.',
				isId.errors ?? [],
			),
		);
		return;
	}

	(async () => {
		await removeFiscalSponsorship(changemakerId, fiscalSponsorChangemakerId);
		res.status(204).contentType('application/json').send();
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error deleting item.', error));
			return;
		}
		next(error);
	});
};

export const changemakersHandlers = {
	postChangemaker,
	getChangemakers,
	getChangemaker,
	patchChangemaker,
	putChangemakerFiscalSponsor,
	deleteChangemakerFiscalSponsor,
};
