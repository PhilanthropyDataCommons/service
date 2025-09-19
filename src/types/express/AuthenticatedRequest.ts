import { ajv } from '../../ajv';
import { keycloakIdSchema } from '../KeycloakId';
import type { KeycloakId } from '../KeycloakId';
import type { Request as JwtRequest } from 'express-jwt';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { AuthContext } from '../AuthContext';

type AuthenticatedRequest = JwtRequest & Partial<AuthContext>;

interface ObjectWithAuthWithSub {
	auth: {
		sub: string;
	};
}

interface ObjectWithAuthWithName {
	auth: {
		name: string;
	};
}

interface ObjectWithAuthWithExp {
	auth: {
		exp: number;
	};
}

interface ObjectWithAuthWithRealmAccessRoles {
	auth: {
		realm_access: {
			roles: string[];
		};
	};
}

interface ObjectWithAuthWithOrganizations {
	auth: {
		organizations: Record<string, { id: KeycloakId }>;
	};
}

const objectWithAuthWithSubSchema: JSONSchemaType<ObjectWithAuthWithSub> = {
	type: 'object',
	properties: {
		auth: {
			type: 'object',
			properties: {
				sub: {
					type: 'string',
				},
			},
			required: ['sub'],
		},
	},
	required: ['auth'],
};

const objectWithAuthWithNameSchema: JSONSchemaType<ObjectWithAuthWithName> = {
	type: 'object',
	properties: {
		auth: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
				},
			},
			required: ['name'],
		},
	},
	required: ['auth'],
};

const objectWithAuthWithExpSchema: JSONSchemaType<ObjectWithAuthWithExp> = {
	type: 'object',
	properties: {
		auth: {
			type: 'object',
			properties: {
				exp: {
					type: 'number',
				},
			},
			required: ['exp'],
		},
	},
	required: ['auth'],
};

const objectWithAuthWithRealmAccessRolesSchema: JSONSchemaType<ObjectWithAuthWithRealmAccessRoles> =
	{
		type: 'object',
		properties: {
			auth: {
				type: 'object',
				properties: {
					realm_access: {
						type: 'object',
						properties: {
							roles: {
								type: 'array',
								items: { type: 'string' },
							},
						},
						required: ['roles'],
					},
				},
				required: ['realm_access'],
			},
		},
		required: ['auth'],
	};

const objectWithAuthWithOrganizationsSchema: JSONSchemaType<ObjectWithAuthWithOrganizations> =
	{
		type: 'object',
		properties: {
			auth: {
				type: 'object',
				properties: {
					organizations: {
						type: 'object',
						additionalProperties: {
							type: 'object',
							properties: {
								id: keycloakIdSchema,
							},
							required: ['id'],
						},
						required: [],
					},
				},
				required: ['organizations'],
			},
		},
		required: ['auth'],
	};

const hasAuthWithSub = ajv.compile(objectWithAuthWithSubSchema);

const hasAuthWithName = ajv.compile(objectWithAuthWithNameSchema);

const isObjectWithAuthWithExp = ajv.compile(objectWithAuthWithExpSchema);

const hasAuthWithRealmAccessRoles = ajv.compile(
	objectWithAuthWithRealmAccessRolesSchema,
);

const isObjectWithAuthWithOrganizations = ajv.compile(
	objectWithAuthWithOrganizationsSchema,
);

const getAuthSubFromRequest = (req: Request): string | undefined =>
	hasAuthWithSub(req) ? req.auth.sub : undefined;

const getAuthNameFromRequest = (req: Request): string | null =>
	hasAuthWithName(req) ? req.auth.name : null;

const getRealmAccessRolesFromRequest = (req: Request): string[] =>
	hasAuthWithRealmAccessRoles(req) ? req.auth.realm_access.roles : [];

const getKeycloakOrganizationIdsFromRequest = (req: Request): KeycloakId[] =>
	isObjectWithAuthWithOrganizations(req)
		? Object.values(req.auth.organizations).map(
				(organization) => organization.id,
			)
		: [];

const getJwtExpFromRequest = (req: Request): number | null =>
	isObjectWithAuthWithExp(req) ? req.auth.exp : null;

const hasMeaningfulAuthSub = (req: Request): boolean => {
	const authSub = getAuthSubFromRequest(req);
	return authSub !== undefined && authSub !== '';
};

export {
	type AuthenticatedRequest,
	getAuthNameFromRequest,
	getAuthSubFromRequest,
	getRealmAccessRolesFromRequest,
	getKeycloakOrganizationIdsFromRequest,
	getJwtExpFromRequest,
	hasMeaningfulAuthSub,
};
