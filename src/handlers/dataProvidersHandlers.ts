import { HTTP_STATUS } from '../constants';
import {
	getDatabase,
	getLimitValues,
	createOrUpdateDataProvider,
	createPermissionGrant,
	loadDataProviderBundle,
	loadDataProvider,
} from '../database';
import {
	getSelfManageGrantFragment,
	isAuthContext,
	isWritableDataProvider,
	PermissionGrantEntityType,
} from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { coerceParams } from '../coercion';
import { isShortCode } from '../types/ShortCode';
import type { Request, Response } from 'express';

const getDataProviders = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const dataProviderBundle = await loadDataProviderBundle(
		db,
		req,
		limit,
		offset,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(dataProviderBundle);
};

const getDataProvider = async (req: Request, res: Response): Promise<void> => {
	const db = getDatabase();
	const { dataProviderShortCode } = coerceParams(req.params);
	if (!isShortCode(dataProviderShortCode)) {
		throw new InputValidationError(
			'Invalid short code.',
			isShortCode.errors ?? [],
		);
	}
	const dataProvider = await loadDataProvider(db, null, dataProviderShortCode);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(dataProvider);
};

const putDataProvider = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { dataProviderShortCode: shortCode } = coerceParams(req.params);
	if (!isShortCode(shortCode)) {
		throw new InputValidationError(
			'Invalid short code.',
			isShortCode.errors ?? [],
		);
	}

	const body = req.body as unknown;
	if (!isWritableDataProvider(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableDataProvider.errors ?? [],
		);
	}
	const { name, keycloakOrganizationId } = body;
	const { committedDataProvider, committedDataProviderWasInserted } =
		await db.transaction(async (txDb) => {
			const { item, wasInserted } = await createOrUpdateDataProvider(
				txDb,
				req,
				{
					shortCode,
					name,
					keycloakOrganizationId,
				},
			);
			if (wasInserted) {
				await createPermissionGrant(txDb, req, {
					...getSelfManageGrantFragment(req),
					contextEntityType: PermissionGrantEntityType.DATA_PROVIDER,
					dataProviderShortCode: item.shortCode,
				});
			}
			return {
				committedDataProvider: item,
				committedDataProviderWasInserted: wasInserted,
			};
		});
	res
		.status(
			committedDataProviderWasInserted
				? HTTP_STATUS.SUCCESSFUL.CREATED
				: HTTP_STATUS.SUCCESSFUL.OK,
		)
		.contentType('application/json')
		.send(committedDataProvider);
};

export const dataProviderHandlers = {
	getDataProviders,
	getDataProvider,
	putDataProvider,
};
