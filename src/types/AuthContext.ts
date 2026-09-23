import { ajv } from '../ajv';
import { userSchema } from './User';
import type { JSONSchemaType } from 'ajv';
import type { User } from './User';
import type { KeycloakId } from './KeycloakId';

interface AuthContext {
	user: User;
	role: {
		isAdministrator: boolean;
		canViewAllUsers?: boolean;
	};
}

type AuthIdentityAndRole = Pick<AuthContext, 'role'> & {
	user: Pick<AuthContext['user'], 'keycloakUserId'>;
};

const authContextSchema: JSONSchemaType<AuthContext> = {
	type: 'object',
	properties: {
		user: userSchema,
		role: {
			type: 'object',
			properties: {
				isAdministrator: {
					type: 'boolean',
				},
				canViewAllUsers: {
					type: 'boolean',
					nullable: true,
				},
			},
			required: ['isAdministrator'],
		},
	},
	required: ['user', 'role'],
};

const isAuthContext = ajv.compile(authContextSchema);

const getKeycloakUserIdFromAuthContext = (
	req: AuthIdentityAndRole | undefined | null,
): KeycloakId | undefined => {
	const keycloakUserId = req?.user.keycloakUserId;
	return keycloakUserId;
};

const getIsAdministratorFromAuthContext = (
	req: AuthIdentityAndRole | undefined | null,
): boolean | undefined => req?.role.isAdministrator;

const getCanViewAllUsersFromAuthContext = (
	req: AuthIdentityAndRole | undefined | null,
): boolean => req?.role.canViewAllUsers ?? false;

export {
	type AuthContext,
	type AuthIdentityAndRole,
	authContextSchema,
	isAuthContext,
	getKeycloakUserIdFromAuthContext,
	getIsAdministratorFromAuthContext,
	getCanViewAllUsersFromAuthContext,
};
