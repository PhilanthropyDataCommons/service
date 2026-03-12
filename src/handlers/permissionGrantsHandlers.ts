import { isEmpty } from '../arrays';
import { HTTP_STATUS } from '../constants';
import {
	createPermissionGrant,
	db,
	getLimitValues,
	loadPermissionGrant,
	loadPermissionGrantBundle,
	removePermissionGrant,
} from '../database';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import {
	getConditionsForScope,
	getScopesForContextEntityType,
	isAuthContext,
	isId,
	isWritablePermissionGrant,
	type PermissionGrantEntityType,
	type PermissionGrantCondition,
	type WritableUnkeyedPermissionGrant,
} from '../types';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';

const assertPermissionGrantHasValidScope = (
	permissionGrant: WritableUnkeyedPermissionGrant,
): void => {
	const { scope, contextEntityType } = permissionGrant;
	const allowedScopeValues = getScopesForContextEntityType(contextEntityType);
	const invalidScope = scope.find((s) => !allowedScopeValues.includes(s));
	if (invalidScope !== undefined) {
		throw new InputValidationError(
			`Scope value "${invalidScope}" is not valid for context entity type "${contextEntityType}". Allowed values: ${allowedScopeValues.join(', ')}.`,
			[],
		);
	}
};

const assertPermissionGrantConditionEntryIsValidForScope = (
	scopeKey: PermissionGrantEntityType,
	condition: PermissionGrantCondition,
): void => {
	const conditionDefinitions = getConditionsForScope(scopeKey);
	const matchingDefinition = conditionDefinitions.find(
		(def) => def.field === condition.field,
	);
	if (matchingDefinition === undefined) {
		throw new InputValidationError(
			`Invalid condition field "${condition.field}" for scope "${scopeKey}".`,
			[],
		);
	}

	if (matchingDefinition.operator !== condition.operator) {
		throw new InputValidationError(
			`Invalid condition operator "${condition.operator}" for scope "${scopeKey}", field "${condition.field}".`,
			[],
		);
	}

	const invalidValue = condition.value.find(
		(v) => !matchingDefinition.value.includes(v),
	);
	if (invalidValue !== undefined) {
		throw new InputValidationError(
			`Invalid condition value "${invalidValue}" for scope "${scopeKey}", field "${condition.field}".`,
			[],
		);
	}
};

const assertPermissionGrantHasValidConditions = (
	permissionGrant: WritableUnkeyedPermissionGrant,
): void => {
	const { conditions, scope } = permissionGrant;
	if (conditions === undefined || conditions === null) {
		return;
	}

	const scopeSet = new Set<string>(scope);
	const conditionKeys = Object.keys(conditions);
	const invalidKeys = conditionKeys.filter((key) => !scopeSet.has(key));
	if (!isEmpty(invalidKeys)) {
		throw new InputValidationError(
			`Condition keys must be present in the grant scope. Invalid keys: ${invalidKeys.join(', ')}`,
			[],
		);
	}

	for (const scopeKey of scope) {
		const { [scopeKey]: condition } = conditions;
		if (condition !== undefined) {
			assertPermissionGrantConditionEntryIsValidForScope(scopeKey, condition);
		}
	}
};

const getPermissionGrants = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { limit, offset } = getLimitValues(paginationParameters);

	const permissionGrantBundle = await loadPermissionGrantBundle(
		db,
		req,
		limit,
		offset,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(permissionGrantBundle);
};

const postPermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const body = req.body as unknown;
	if (!isWritablePermissionGrant(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritablePermissionGrant.errors ?? [],
		);
	}

	assertPermissionGrantHasValidScope(body);
	assertPermissionGrantHasValidConditions(body);
	const permissionGrant = await createPermissionGrant(db, req, body);

	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(permissionGrant);
};

const getPermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const { permissionGrantId } = coerceParams(req.params);
	if (!isId(permissionGrantId)) {
		throw new InputValidationError(
			'Invalid permissionGrantId parameter.',
			isId.errors ?? [],
		);
	}

	const permissionGrant = await loadPermissionGrant(db, req, permissionGrantId);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(permissionGrant);
};

const deletePermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const { permissionGrantId } = coerceParams(req.params);
	if (!isId(permissionGrantId)) {
		throw new InputValidationError(
			'Invalid permissionGrantId parameter.',
			isId.errors ?? [],
		);
	}

	await removePermissionGrant(db, req, permissionGrantId);

	res
		.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT)
		.contentType('application/json')
		.send();
};

const permissionGrantsHandlers = {
	deletePermissionGrant,
	getPermissionGrant,
	getPermissionGrants,
	postPermissionGrant,
};

export { permissionGrantsHandlers };
