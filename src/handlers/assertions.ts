import { isEmpty } from '../arrays';
import { hasSourcePermission, loadSource } from '../database';
import {
	getConditionsForScope,
	getScopesForContextEntityType,
	PermissionGrantEntityType,
	PermissionGrantVerb,
} from '../types';
import { ForbiddenError, InputValidationError } from '../errors';
import type { TinyPg } from 'tinypg';
import type {
	AuthContext,
	Id,
	PermissionGrantCondition,
	WritableUnkeyedPermissionGrant,
} from '../types';

/**
 * Loading the source before throwing keeps a caller who cannot see the source
 * at all on the `NotFoundError` path, so a `ForbiddenError` never reveals that
 * an otherwise invisible source exists.
 */
const assertSourceIsReferenceable = async (
	db: TinyPg,
	authContext: AuthContext,
	sourceId: Id,
): Promise<void> => {
	if (
		!(await hasSourcePermission(db, authContext, {
			sourceId,
			permission: PermissionGrantVerb.REFERENCE,
			scope: PermissionGrantEntityType.SOURCE,
		}))
	) {
		await loadSource(db, authContext, sourceId);
		throw new ForbiddenError(
			'Authenticated user does not have permission to reference the specified source.',
		);
	}
};

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

export {
	assertPermissionGrantContextEntityTypeIsSupported,
	assertPermissionGrantHasValidConditions,
	assertPermissionGrantHasValidScope,
	assertSourceIsReferenceable,
};
