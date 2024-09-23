import { Request as JwtRequest } from 'express-jwt';
import { ajv } from '../../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { AuthContext } from '../AuthContext';

type AuthenticatedRequest = JwtRequest & Partial<AuthContext>;

interface ObjectWithAuthWithSub {
	auth: {
		sub: string;
	};
}

interface ObjectWithAuthWithRealmAccessRoles {
	auth: {
		realm_access: {
			roles: string[];
		};
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

const hasAuthWithSub = ajv.compile(objectWithAuthWithSubSchema);

const hasAuthWithRealmAccessRoles = ajv.compile(
	objectWithAuthWithRealmAccessRolesSchema,
);

const getAuthSubFromRequest = (req: Request): string | undefined =>
	hasAuthWithSub(req) ? req.auth.sub : undefined;

const getRealmAccessRolesFromRequest = (req: Request): string[] =>
	hasAuthWithRealmAccessRoles(req) ? req.auth.realm_access.roles : [];

const hasMeaningfulAuthSub = (req: Request): boolean => {
	const authSub = getAuthSubFromRequest(req);
	return authSub !== undefined && authSub !== '';
};

export {
	AuthenticatedRequest,
	getAuthSubFromRequest,
	getRealmAccessRolesFromRequest,
	hasMeaningfulAuthSub,
};
