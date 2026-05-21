import { HTTP_STATUS } from '../constants';
import {
	getDatabase,
	createOrUpdateFunder,
	createPermissionGrant,
	getLimitValues,
	loadFunderBundle,
	loadFunder,
} from '../database';
import {
	getSelfManageGrantFragment,
	isAuthContext,
	isWritableFunder,
	PermissionGrantEntityType,
} from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import {
	extractIsCollaborativeParameters,
	extractPaginationParameters,
	extractSearchParameters,
} from '../queryParameters';
import { coerceParams } from '../coercion';
import { isShortCode } from '../types/ShortCode';
import type { Request, Response } from 'express';

const getFunders = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { search } = extractSearchParameters(req);
	const { isCollaborative } = extractIsCollaborativeParameters(req);
	const funderBundle = await loadFunderBundle(
		db,
		req,
		search,
		isCollaborative,
		limit,
		offset,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(funderBundle);
};

const getFunder = async (req: Request, res: Response): Promise<void> => {
	const db = getDatabase();
	const { funderShortCode } = coerceParams(req.params);
	if (!isShortCode(funderShortCode)) {
		throw new InputValidationError(
			'Invalid short code.',
			isShortCode.errors ?? [],
		);
	}
	const funder = await loadFunder(db, null, funderShortCode);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(funder);
};

const putFunder = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { funderShortCode: shortCode } = coerceParams(req.params);
	if (!isShortCode(shortCode)) {
		throw new InputValidationError(
			'Invalid short code.',
			isShortCode.errors ?? [],
		);
	}

	const body = req.body as unknown;
	if (!isWritableFunder(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableFunder.errors ?? [],
		);
	}

	const {
		name,
		keycloakOrganizationId,
		isCollaborative,
		defaultTerminologySetId,
	} = body;
	const { committedFunder, committedFunderWasInserted } = await db.transaction(
		async (txDb) => {
			const { item, wasInserted } = await createOrUpdateFunder(txDb, req, {
				shortCode,
				name,
				keycloakOrganizationId,
				isCollaborative,
				defaultTerminologySetId,
			});
			if (wasInserted) {
				await createPermissionGrant(txDb, req, {
					...getSelfManageGrantFragment(req),
					contextEntityType: PermissionGrantEntityType.FUNDER,
					funderShortCode: item.shortCode,
				});
			}
			return { committedFunder: item, committedFunderWasInserted: wasInserted };
		},
	);
	res
		.status(
			committedFunderWasInserted
				? HTTP_STATUS.SUCCESSFUL.CREATED
				: HTTP_STATUS.SUCCESSFUL.OK,
		)
		.contentType('application/json')
		.send(committedFunder);
};

export const fundersHandlers = {
	getFunders,
	getFunder,
	putFunder,
};
