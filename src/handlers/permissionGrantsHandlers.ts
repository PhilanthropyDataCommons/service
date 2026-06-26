import { isEmpty } from '../arrays';
import { HTTP_STATUS } from '../constants';
import {
	canManagePermissionGrantByContext,
	canManagePermissionGrantById,
	createPermissionGrant,
	getDatabase,
	getLimitValues,
	loadApplicationForm,
	loadApplicationFormField,
	loadBulkUploadTask,
	loadChangemaker,
	loadChangemakerFieldValue,
	loadDataProvider,
	loadFunder,
	loadOpportunity,
	loadPermissionGrant,
	loadPermissionGrantBundle,
	loadProposal,
	loadProposalFieldValue,
	loadProposalVersion,
	loadSource,
	loadTerminologySet,
	removePermissionGrant,
	updatePermissionGrant,
} from '../database';
import {
	FailedMiddlewareError,
	ForbiddenError,
	InputValidationError,
	NoDataReturnedError,
	NotFoundError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import {
	getConditionsForScope,
	getScopesForContextEntityType,
	isAuthContext,
	isId,
	isWritablePermissionGrant,
	PermissionGrantEntityType,
	type AuthIdentityAndRole,
	type Id,
	type PermissionGrantCondition,
	type WritablePermissionGrant,
	type WritableUnkeyedPermissionGrant,
} from '../types';
import { coerceParams } from '../coercion';
import type { TinyPg } from 'tinypg';
import type { Request, Response } from 'express';

const assertPermissionGrantContextEntityTypeIsSupported = (
	permissionGrant: WritableUnkeyedPermissionGrant,
): void => {
	if (permissionGrant.contextEntityType === PermissionGrantEntityType.ANY) {
		throw new InputValidationError(
			`Context entity type "${PermissionGrantEntityType.ANY}" is not currently supported.`,
			[],
		);
	}
};

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
		(def) => def.property === condition.property,
	);
	if (matchingDefinition === undefined) {
		throw new InputValidationError(
			`Invalid condition property "${condition.property}" for scope "${scopeKey}".`,
			[],
		);
	}

	if (matchingDefinition.operator !== condition.operator) {
		throw new InputValidationError(
			`Invalid condition operator "${condition.operator}" for scope "${scopeKey}", property "${condition.property}".`,
			[],
		);
	}

	const invalidValue = condition.value.find(
		(v) => !matchingDefinition.value.includes(v),
	);
	if (invalidValue !== undefined) {
		throw new InputValidationError(
			`Invalid condition value "${invalidValue}" for scope "${scopeKey}", property "${condition.property}".`,
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

/**
 * Loads the grant's context entity so a missing or unviewable entity surfaces
 * as a `NotFoundError` (404). Callers use this to distinguish "the context
 * entity does not exist" from "the entity exists but the user cannot manage its
 * grants" (403).
 */
const assertPermissionGrantContextEntityExists = async (
	db: Pick<TinyPg, 'sql'>,
	authContext: AuthIdentityAndRole,
	body: WritablePermissionGrant,
): Promise<void> => {
	switch (body.contextEntityType) {
		case PermissionGrantEntityType.FUNDER:
			await loadFunder(db, authContext, body.funderShortCode);
			break;
		case PermissionGrantEntityType.CHANGEMAKER:
			await loadChangemaker(db, authContext, body.changemakerId);
			break;
		case PermissionGrantEntityType.DATA_PROVIDER:
			await loadDataProvider(db, authContext, body.dataProviderShortCode);
			break;
		case PermissionGrantEntityType.OPPORTUNITY:
			await loadOpportunity(db, authContext, body.opportunityId);
			break;
		case PermissionGrantEntityType.PROPOSAL:
			await loadProposal(db, authContext, body.proposalId);
			break;
		case PermissionGrantEntityType.PROPOSAL_VERSION:
			await loadProposalVersion(db, authContext, body.proposalVersionId);
			break;
		case PermissionGrantEntityType.APPLICATION_FORM:
			await loadApplicationForm(db, authContext, body.applicationFormId);
			break;
		case PermissionGrantEntityType.APPLICATION_FORM_FIELD:
			await loadApplicationFormField(
				db,
				authContext,
				body.applicationFormFieldId,
			);
			break;
		case PermissionGrantEntityType.PROPOSAL_FIELD_VALUE:
			await loadProposalFieldValue(db, authContext, body.proposalFieldValueId);
			break;
		case PermissionGrantEntityType.SOURCE:
			await loadSource(db, authContext, body.sourceId);
			break;
		case PermissionGrantEntityType.TERMINOLOGY_SET:
			await loadTerminologySet(db, authContext, body.terminologySetId);
			break;
		case PermissionGrantEntityType.BULK_UPLOAD:
			await loadBulkUploadTask(db, authContext, body.bulkUploadTaskId);
			break;
		case PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE:
			await loadChangemakerFieldValue(
				db,
				authContext,
				body.changemakerFieldValueId,
			);
			break;
		case PermissionGrantEntityType.ANY:
			break;
	}
};

const getPermissionGrants = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
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
	const db = getDatabase();

	const body = req.body as unknown;
	if (!isWritablePermissionGrant(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritablePermissionGrant.errors ?? [],
		);
	}

	assertPermissionGrantContextEntityTypeIsSupported(body);
	assertPermissionGrantHasValidScope(body);
	assertPermissionGrantHasValidConditions(body);

	if (!(await canManagePermissionGrantByContext(db, req, body))) {
		await assertPermissionGrantContextEntityExists(db, req, body);
		throw new ForbiddenError(
			'Authenticated user does not have permission to manage permission grants on the specified context entity.',
		);
	}

	const permissionGrant = await createPermissionGrant(db, req, body);

	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(permissionGrant);
};

const assertCanManagePermissionGrantById = async (
	db: Pick<TinyPg, 'sql'>,
	authContext: AuthIdentityAndRole,
	permissionGrantId: Id,
): Promise<void> => {
	if (
		!(await canManagePermissionGrantById(db, authContext, {
			permissionGrantId,
		}))
	) {
		throw new NotFoundError('The given permission grant was not found.', {
			entityType: 'PermissionGrant',
			entityPrimaryKey: {
				permissionGrantId,
			},
		});
	}
};

const getPermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { permissionGrantId } = coerceParams(req.params);
	if (!isId(permissionGrantId)) {
		throw new InputValidationError(
			'Invalid permissionGrantId parameter.',
			isId.errors ?? [],
		);
	}

	await assertCanManagePermissionGrantById(db, req, permissionGrantId);

	const permissionGrant = await loadPermissionGrant(db, req, permissionGrantId);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(permissionGrant);
};

const putPermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { permissionGrantId } = coerceParams(req.params);
	if (!isId(permissionGrantId)) {
		throw new InputValidationError(
			'Invalid permissionGrantId parameter.',
			isId.errors ?? [],
		);
	}

	await assertCanManagePermissionGrantById(db, req, permissionGrantId);

	const body = req.body as unknown;
	if (!isWritablePermissionGrant(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritablePermissionGrant.errors ?? [],
		);
	}

	assertPermissionGrantContextEntityTypeIsSupported(body);
	assertPermissionGrantHasValidScope(body);
	assertPermissionGrantHasValidConditions(body);

	if (!(await canManagePermissionGrantByContext(db, req, body))) {
		await assertPermissionGrantContextEntityExists(db, req, body);
		throw new ForbiddenError(
			'Authenticated user does not have permission to manage permission grants on the specified context entity.',
		);
	}

	try {
		const permissionGrant = await updatePermissionGrant(
			db,
			req,
			body,
			permissionGrantId,
		);
		res
			.status(HTTP_STATUS.SUCCESSFUL.OK)
			.contentType('application/json')
			.send(permissionGrant);
	} catch (error: unknown) {
		if (error instanceof NoDataReturnedError) {
			throw new NotFoundError(
				'The given permission grant was not found.',
				{
					entityType: 'PermissionGrant',
					entityPrimaryKey: {
						permissionGrantId,
					},
				},
				{ cause: error },
			);
		}
		throw error;
	}
};

const deletePermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { permissionGrantId } = coerceParams(req.params);
	if (!isId(permissionGrantId)) {
		throw new InputValidationError(
			'Invalid permissionGrantId parameter.',
			isId.errors ?? [],
		);
	}

	await assertCanManagePermissionGrantById(db, req, permissionGrantId);

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
	putPermissionGrant,
};

export { permissionGrantsHandlers };
