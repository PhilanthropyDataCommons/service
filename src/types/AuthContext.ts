import { ajv } from '../ajv';
import { userSchema } from './User';
import type { JSONSchemaType } from 'ajv';
import type { User } from './User';
import type { KeycloakId } from './KeycloakId';

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
): KeycloakId | undefined => {
	const keycloakUserId = req?.user?.keycloakUserId;
	return keycloakUserId;
};

export {
	AuthContext,
	authContextSchema,
	isAuthContext,
	getKeycloakUserIdFromAuthContext,
};
