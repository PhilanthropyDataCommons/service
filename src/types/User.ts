import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface User {
	readonly id: number;
	authenticationId: string;
	sourceId?: number;
	readonly createdAt: string;
}

const userSchema: JSONSchemaType<User> = {
	type: 'object',
	properties: {
		id: {
			type: 'number',
		},
		authenticationId: {
			type: 'string',
		},
		sourceId: {
			type: 'number',
			nullable: true,
		},
		createdAt: {
			type: 'string',
		},
	},
	required: ['id', 'authenticationId', 'createdAt'],
};

type WritableUser = Writable<User>;

export { User, userSchema, WritableUser };
