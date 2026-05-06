import { HTTP_STATUS } from '../constants';
import {
	createPermissionGrant,
	getDatabase,
	createSource,
	getLimitValues,
	hasChangemakerPermission,
	hasDataProviderPermission,
	hasFunderPermission,
	loadSource,
	loadSourceBundle,
	removeSource,
} from '../database';
import {
	getSelfManageGrantPartial,
	isAuthContext,
	isId,
	isWritableSource,
	PermissionGrantEntityType,
	PermissionGrantVerb,
} from '../types';
import {
	FailedMiddlewareError,
	InputValidationError,
	UnprocessableEntityError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';

const postSource = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const body = req.body as unknown;
	if (!isWritableSource(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableSource.errors ?? [],
		);
	}
	if (
		'funderShortCode' in body &&
		!(await hasFunderPermission(db, req, {
			funderShortCode: body.funderShortCode,
			permission: PermissionGrantVerb.CREATE,
			scope: PermissionGrantEntityType.SOURCE,
		}))
	) {
		throw new UnprocessableEntityError(
			'You do not have permission to create a source for the specified funder.',
		);
	}
	if (
		'dataProviderShortCode' in body &&
		!(await hasDataProviderPermission(db, req, {
			dataProviderShortCode: body.dataProviderShortCode,
			permission: PermissionGrantVerb.CREATE,
			scope: PermissionGrantEntityType.SOURCE,
		}))
	) {
		throw new UnprocessableEntityError(
			'You do not have permission to create a source for the specified data provider.',
		);
	}
	if (
		'changemakerId' in body &&
		!(await hasChangemakerPermission(db, req, {
			changemakerId: body.changemakerId,
			permission: PermissionGrantVerb.CREATE,
			scope: PermissionGrantEntityType.SOURCE,
		}))
	) {
		throw new UnprocessableEntityError(
			'You do not have permission to create a source for the specified changemaker.',
		);
	}

	// Normally we try to avoid passing the body directly vs extracting the values and passing them.
	// Because because writableSource is a union type it is hard to extract the values directly without
	// losing type context that the union provided.
	const committedSource = await db.transaction(async (txDb) => {
		const source = await createSource(txDb, req, body);
		await createPermissionGrant(txDb, req, {
			...getSelfManageGrantPartial(req),
			contextEntityType: PermissionGrantEntityType.SOURCE,
			sourceId: source.id,
		});
		return source;
	});
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(committedSource);
};

const getSources = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const bundle = await loadSourceBundle(db, req, limit, offset);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(bundle);
};

const getSource = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { sourceId } = coerceParams(req.params);
	if (!isId(sourceId)) {
		throw new InputValidationError('Invalid request body.', isId.errors ?? []);
	}
	const source = await loadSource(db, req, sourceId);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(source);
};

const deleteSource = async (req: Request, res: Response): Promise<void> => {
	const db = getDatabase();
	const { sourceId } = coerceParams(req.params);
	if (!isId(sourceId)) {
		throw new InputValidationError('Invalid request body.', isId.errors ?? []);
	}

	const item = await removeSource(db, null, sourceId);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(item);
};

export const sourcesHandlers = {
	postSource,
	getSources,
	getSource,
	deleteSource,
};
