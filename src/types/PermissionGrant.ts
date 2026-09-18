import { ajv } from '../ajv';
import { isEmpty } from '../arrays';
import { keycloakIdSchema } from './KeycloakId';
import {
	permissionGrantConditionSchema,
	type PermissionGrantCondition,
} from './PermissionGrantCondition';
import {
	contextEntityKeyProperties,
	isPermissionGrantKeyedContextEntityType,
	jsonSchemaTypeForPermissionGrantEntityKeyType,
	PermissionGrantEntityType,
	type PermissionGrantEntityKeyValueType,
	type PermissionGrantKeyedContextEntityType,
} from './PermissionGrantEntityType';
import {
	PermissionGrantGranteeType,
	permissionGrantGranteeTypeSchema,
} from './PermissionGrantGranteeType';
import {
	PermissionGrantVerb,
	permissionGrantVerbSchema,
} from './PermissionGrantVerb';
import type { TypeGuardWithAjvErrors } from '../ajv';
import type { AuthContext } from './AuthContext';
import type { Id } from './Id';
import type { KeycloakId } from './KeycloakId';
import type { User } from './User';
import type { Writable } from './Writable';
import type { ErrorObject, ValidateFunction } from 'ajv';

// The key name for each grantee type that carries an identifier. Grantee
// types without an identifier (e.g. `authenticatedUsers`) are omitted.
const granteeKeyProperties = {
	[PermissionGrantGranteeType.USER]: { keyName: 'granteeUserKeycloakUserId' },
	[PermissionGrantGranteeType.USER_GROUP]: {
		keyName: 'granteeKeycloakOrganizationId',
	},
} as const satisfies Omit<
	Record<PermissionGrantGranteeType, { keyName: string }>,
	PermissionGrantGranteeType.AUTHENTICATED_USERS
>;

type PermissionGrantKeyedGranteeType = keyof typeof granteeKeyProperties;

interface UnkeyedPermissionGrant {
	readonly id: Id;
	verbs: PermissionGrantVerb[];
	readonly createdBy: KeycloakId;
	readonly createdByUser: User;
	readonly createdAt: string;
	contextEntityType: PermissionGrantEntityType;
	granteeType: PermissionGrantGranteeType;
	scope: PermissionGrantEntityType[];
	conditions?: Partial<
		Record<PermissionGrantEntityType, PermissionGrantCondition>
	> | null;
}

type GranteeKeysByGranteeType = {
	[G in PermissionGrantKeyedGranteeType]: Record<
		(typeof granteeKeyProperties)[G]['keyName'],
		KeycloakId
	>;
};

type ContextEntityKeysByContextEntityType = {
	[T in PermissionGrantKeyedContextEntityType]: Record<
		(typeof contextEntityKeyProperties)[T]['keyName'],
		PermissionGrantEntityKeyValueType[(typeof contextEntityKeyProperties)[T]['keyType']]
	>;
};

type PermissionGrantGranteeKeyVariant<G extends PermissionGrantGranteeType> =
	G extends PermissionGrantKeyedGranteeType
		? GranteeKeysByGranteeType[G] & { granteeType: G }
		: { granteeType: G };

type PermissionGrantContextEntityKeyVariant<
	C extends PermissionGrantEntityType,
> = C extends PermissionGrantKeyedContextEntityType
	? ContextEntityKeysByContextEntityType[C] & {
			contextEntityType: C;
		}
	: { contextEntityType: C };

type PermissionGrantContextEntity = {
	[C in PermissionGrantEntityType]: PermissionGrantContextEntityKeyVariant<C>;
}[PermissionGrantEntityType];

type PermissionGrantGrantee = {
	[G in PermissionGrantGranteeType]: PermissionGrantGranteeKeyVariant<G>;
}[PermissionGrantGranteeType];

type PermissionGrant = UnkeyedPermissionGrant &
	PermissionGrantContextEntity &
	PermissionGrantGrantee;

type WritablePermissionGrant = Writable<PermissionGrant>;

type WritableUnkeyedPermissionGrant = Writable<UnkeyedPermissionGrant>;

const isWritableUnkeyedPermissionGrant =
	ajv.compile<WritableUnkeyedPermissionGrant>({
		type: 'object',
		properties: {
			contextEntityType: {
				type: 'string',
				enum: Object.values(PermissionGrantEntityType),
			},
			granteeType: permissionGrantGranteeTypeSchema,
			verbs: {
				type: 'array',
				items: permissionGrantVerbSchema,
				minItems: 1,
			},
			scope: {
				type: 'array',
				items: {
					type: 'string',
					enum: Object.values(PermissionGrantEntityType),
				},
				minItems: 1,
			},
			conditions: {
				type: 'object',
				nullable: true,
				properties: Object.fromEntries(
					Object.values(PermissionGrantEntityType).map((entityType) => [
						entityType,
						permissionGrantConditionSchema,
					]),
				),
				additionalProperties: false,
			},
		},
		required: ['contextEntityType', 'granteeType', 'verbs', 'scope'],
	});

const contextKeyValidatorCache = new Map<
	PermissionGrantKeyedContextEntityType,
	ValidateFunction
>();

const getContextKeyValidator = (
	contextEntityType: PermissionGrantKeyedContextEntityType,
): ValidateFunction => {
	const existing = contextKeyValidatorCache.get(contextEntityType);
	if (existing !== undefined) {
		return existing;
	}
	const {
		[contextEntityType]: { keyName, keyType },
	} = contextEntityKeyProperties;
	const validator = ajv.compile({
		type: 'object',
		properties: {
			[keyName]: {
				type: jsonSchemaTypeForPermissionGrantEntityKeyType[keyType],
			},
		},
		required: [keyName],
	});
	contextKeyValidatorCache.set(contextEntityType, validator);
	return validator;
};

const granteeKeyValidatorCache = new Map<
	PermissionGrantKeyedGranteeType,
	ValidateFunction
>();

const getGranteeKeyValidator = (
	granteeType: PermissionGrantKeyedGranteeType,
): ValidateFunction => {
	const existing = granteeKeyValidatorCache.get(granteeType);
	if (existing !== undefined) {
		return existing;
	}
	const {
		[granteeType]: { keyName },
	} = granteeKeyProperties;
	const validator = ajv.compile({
		type: 'object',
		properties: {
			[keyName]: keycloakIdSchema,
		},
		required: [keyName],
	});
	granteeKeyValidatorCache.set(granteeType, validator);
	return validator;
};

const coreWritableKeys = new Set([
	'contextEntityType',
	'granteeType',
	'verbs',
	'scope',
	'conditions',
]);

const isPermissionGrantKeyedGranteeType = (
	granteeType: PermissionGrantGranteeType,
): granteeType is PermissionGrantKeyedGranteeType =>
	granteeType in granteeKeyProperties;

interface KeyedPermissionGrantProperty {
	keyName: string;
	validate: ValidateFunction;
}

/**
 * The key each of a body's `contextEntityType` and `granteeType` requires,
 * paired with the validator that checks it. A type carrying no key of its own
 * (e.g. `granteeType: authenticatedUsers`) contributes nothing.
 */
const getKeyedPermissionGrantProperties = (
	{ contextEntityType, granteeType }: WritableUnkeyedPermissionGrant,
	includeContextEntityKey: boolean,
): KeyedPermissionGrantProperty[] => {
	const properties: KeyedPermissionGrantProperty[] = [];
	if (
		includeContextEntityKey &&
		isPermissionGrantKeyedContextEntityType(contextEntityType)
	) {
		properties.push({
			keyName: contextEntityKeyProperties[contextEntityType].keyName,
			validate: getContextKeyValidator(contextEntityType),
		});
	}
	if (isPermissionGrantKeyedGranteeType(granteeType)) {
		properties.push({
			keyName: granteeKeyProperties[granteeType].keyName,
			validate: getGranteeKeyValidator(granteeType),
		});
	}
	return properties;
};

const getUnexpectedKeyErrors = (
	data: object,
	allowedKeys: Set<string>,
): ErrorObject[] | null => {
	const unexpectedKeys = Object.keys(data).filter(
		(key) => !allowedKeys.has(key),
	);
	if (isEmpty(unexpectedKeys)) {
		return null;
	}
	return unexpectedKeys.map((key) => ({
		instancePath: '',
		schemaPath: '',
		keyword: 'additionalProperties',
		params: { additionalProperty: key },
		message: `must NOT have additional property '${key}'`,
	}));
};

/**
 * Runs the validation a writable permission grant body shares with a writable
 * default permission grant body, returning `null` when the body is valid and
 * the ajv errors describing the first failure otherwise.
 *
 * `includeContextEntityKey` says whether the key naming the context entity
 * (e.g. `changemakerId`) belongs to the shape being validated. A default
 * permission grant names only a context entity *type*, so its context entity
 * key is neither required nor allowed.
 */
const validateWritablePermissionGrantFields = (
	data: unknown,
	{ includeContextEntityKey }: { includeContextEntityKey: boolean },
): ErrorObject[] | null => {
	if (!isWritableUnkeyedPermissionGrant(data)) {
		return isWritableUnkeyedPermissionGrant.errors ?? [];
	}

	const keyedProperties = getKeyedPermissionGrantProperties(
		data,
		includeContextEntityKey,
	);
	const invalidProperty = keyedProperties.find(
		({ validate }) => !validate(data),
	);
	if (invalidProperty !== undefined) {
		return invalidProperty.validate.errors ?? [];
	}

	return getUnexpectedKeyErrors(
		data,
		new Set([
			...coreWritableKeys,
			...keyedProperties.map(({ keyName }) => keyName),
		]),
	);
};

const isWritablePermissionGrant: TypeGuardWithAjvErrors<
	WritablePermissionGrant
> = (data: unknown): data is WritablePermissionGrant => {
	const errors = validateWritablePermissionGrantFields(data, {
		includeContextEntityKey: true,
	});
	isWritablePermissionGrant.errors = errors;
	return errors === null;
};

/**
 * Returns the grantee + scope + verbs portion of a permission grant that
 * gives the auth user `manage` against `any` scope. Spread into a grant
 * alongside `contextEntityType` and the entity-specific key field.
 */
const getSelfManageGrantFragment = (
	authContext: AuthContext,
): Pick<
	Extract<
		WritablePermissionGrant,
		{ granteeType: PermissionGrantGranteeType.USER }
	>,
	'granteeType' | 'granteeUserKeycloakUserId' | 'scope' | 'verbs'
> => ({
	granteeType: PermissionGrantGranteeType.USER,
	granteeUserKeycloakUserId: authContext.user.keycloakUserId,
	scope: [PermissionGrantEntityType.ANY],
	verbs: [PermissionGrantVerb.MANAGE],
});

export {
	getSelfManageGrantFragment,
	isPermissionGrantKeyedGranteeType,
	isWritablePermissionGrant,
	validateWritablePermissionGrantFields,
	type PermissionGrant,
	type PermissionGrantContextEntity,
	type PermissionGrantGrantee,
	type PermissionGrantKeyedGranteeType,
	type UnkeyedPermissionGrant,
	type WritablePermissionGrant,
	type WritableUnkeyedPermissionGrant,
};
