import { ajv } from '../ajv';
import { userSchema } from './User';
import type { JSONSchemaType } from 'ajv';
import type { User } from './User';
import type { KeycloakId } from './KeycloakId';

interface AuthContext {
	authContextId: string;
	user: User;
	role: {
		isAdministrator: boolean;
		canViewUsersInKeycloak: boolean;
		canViewOrganizationsInKeycloak: boolean;
	};
}

type AuthIdentityAndRole = Pick<AuthContext, 'authContextId' | 'role'> & {
	user: Pick<AuthContext['user'], 'keycloakUserId'>;
};

const EMPTY_AUTH_CONTEXT_ROLES: AuthContext['role'] = {
	isAdministrator: false,
	canViewUsersInKeycloak: false,
	canViewOrganizationsInKeycloak: false,
};

const authContextSchema: JSONSchemaType<AuthContext> = {
	type: 'object',
	properties: {
		authContextId: {
			type: 'string',
		},
		user: userSchema,
		role: {
			type: 'object',
			properties: {
				isAdministrator: {
					type: 'boolean',
				},
				canViewUsersInKeycloak: {
					type: 'boolean',
				},
				canViewOrganizationsInKeycloak: {
					type: 'boolean',
				},
			},
			required: [
				'isAdministrator',
				'canViewUsersInKeycloak',
				'canViewOrganizationsInKeycloak',
			],
		},
	},
	required: ['authContextId', 'user', 'role'],
};

const isAuthContext = ajv.compile(authContextSchema);

const getAuthContextIdFromAuthContext = (
	req: AuthIdentityAndRole | undefined | null,
): string | undefined => req?.authContextId;

const getKeycloakUserIdFromAuthContext = (
	req: AuthIdentityAndRole | undefined | null,
): KeycloakId | undefined => {
	const keycloakUserId = req?.user.keycloakUserId;
	return keycloakUserId;
};

const getIsAdministratorFromAuthContext = (
	req: AuthIdentityAndRole | undefined | null,
): boolean | undefined => req?.role.isAdministrator;

const getCanViewUsersInKeycloakFromAuthContext = (
	req: AuthIdentityAndRole | undefined | null,
): boolean | undefined => req?.role.canViewUsersInKeycloak;

const getCanViewOrganizationsInKeycloakFromAuthContext = (
	req: AuthIdentityAndRole | undefined | null,
): boolean | undefined => req?.role.canViewOrganizationsInKeycloak;

export {
	type AuthContext,
	type AuthIdentityAndRole,
	EMPTY_AUTH_CONTEXT_ROLES,
	authContextSchema,
	isAuthContext,
	getAuthContextIdFromAuthContext,
	getKeycloakUserIdFromAuthContext,
	getIsAdministratorFromAuthContext,
	getCanViewUsersInKeycloakFromAuthContext,
	getCanViewOrganizationsInKeycloakFromAuthContext,
};
