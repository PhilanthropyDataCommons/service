import { ajv } from '../ajv';
import { userSchema } from './User';
import type { JSONSchemaType } from 'ajv';
import type { User } from './User';
import type { KeycloakUserId } from './KeycloakUserId';

interface AuthContext {
	user: User;
	role: {
		isAdministrator: boolean;
	};
}

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
			},
			required: ['isAdministrator'],
		},
	},
	required: ['user', 'role'],
};

const isAuthContext = ajv.compile(authContextSchema);

const getKeycloakUserIdFromAuthContext = (
	req: AuthContext | undefined,
): KeycloakUserId | undefined => req?.user?.keycloakUserId;

export {
	AuthContext,
	authContextSchema,
	isAuthContext,
	getKeycloakUserIdFromAuthContext,
};
