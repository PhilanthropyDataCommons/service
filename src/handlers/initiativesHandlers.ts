import { HTTP_STATUS } from '../constants';
import {
	createInitiative,
	createPermissionGrant,
	getDatabase,
	getLimitValues,
	hasChangemakerPermission,
	hasInitiativePermission,
	loadChangemaker,
	loadInitiative,
	loadInitiativeBundle,
	updateInitiative,
} from '../database';
import {
	getSelfManageGrantFragment,
	isAuthContext,
	isId,
	isInitiativePatch,
	isWritableInitiative,
	PermissionGrantEntityType,
	PermissionGrantVerb,
} from '../types';
import {
	FailedMiddlewareError,
	ForbiddenError,
	InputValidationError,
} from '../errors';
import {
	extractChangemakerParameters,
	extractPaginationParameters,
} from '../queryParameters';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';

const getInitiatives = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { changemakerId } = extractChangemakerParameters(req);
	const bundle = await loadInitiativeBundle(
		db,
		req,
		changemakerId,
		limit,
		offset,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(bundle);
};

const getInitiative = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { initiativeId } = coerceParams(req.params);
	if (!isId(initiativeId)) {
		throw new InputValidationError('Invalid id parameter.', isId.errors ?? []);
	}
	const initiative = await loadInitiative(db, req, initiativeId);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(initiative);
};

const postInitiative = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const body = req.body as unknown;
	if (!isWritableInitiative(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableInitiative.errors ?? [],
		);
	}

	await loadChangemaker(db, req, body.changemakerId);

	if (
		!(await hasChangemakerPermission(db, req, {
			changemakerId: body.changemakerId,
			permission: PermissionGrantVerb.EDIT,
			scope: PermissionGrantEntityType.INITIATIVE,
		}))
	) {
		throw new ForbiddenError(
			'Authenticated user does not have permission to create an initiative for the specified changemaker.',
		);
	}

	const committedInitiative = await db.transaction(async (txDb) => {
		const initiative = await createInitiative(txDb, req, body);
		await createPermissionGrant(txDb, req, {
			...getSelfManageGrantFragment(req),
			contextEntityType: PermissionGrantEntityType.INITIATIVE,
			initiativeId: initiative.id,
		});
		return initiative;
	});
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(committedInitiative);
};

const patchInitiative = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { initiativeId } = coerceParams(req.params);
	if (!isId(initiativeId)) {
		throw new InputValidationError('Invalid id parameter.', isId.errors ?? []);
	}
	if (!isInitiativePatch(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isInitiativePatch.errors ?? [],
		);
	}

	await loadInitiative(db, req, initiativeId);

	if (
		!(await hasInitiativePermission(db, req, {
			initiativeId,
			permission: PermissionGrantVerb.EDIT,
			scope: PermissionGrantEntityType.INITIATIVE,
		}))
	) {
		throw new ForbiddenError(
			'Authenticated user does not have permission to edit the specified initiative.',
		);
	}

	const updatedInitiative = await updateInitiative(
		db,
		req,
		req.body,
		initiativeId,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(updatedInitiative);
};

const initiativesHandlers = {
	getInitiatives,
	getInitiative,
	postInitiative,
	patchInitiative,
};

export { initiativesHandlers };
