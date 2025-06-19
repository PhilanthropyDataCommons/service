import { ajv } from '../ajv';
import { keycloakIdSchema } from './KeycloakId';
import type { KeycloakId } from './KeycloakId';
import type { Writable } from './Writable';
import type { JSONSchemaType } from 'ajv';
import type { ShortCode } from './ShortCode';

interface Funder {
	readonly shortCode: ShortCode;
	name: string;
	keycloakOrganizationId: KeycloakId | null;
	readonly createdAt: string;
}

type WritableFunder = Writable<Funder>;

type InternallyWritableFunder = WritableFunder & Pick<Funder, 'shortCode'>;

const writableFunderSchema: JSONSchemaType<WritableFunder> = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		keycloakOrganizationId: {
			...keycloakIdSchema,
			// This is a gross workaround for the fact that AJV does not support nullable types in TypeScript.
			// See: https://github.com/ajv-validator/ajv/issues/2163
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			nullable: true as false,
		},
	},
	required: ['name'],
};

const isWritableFunder = ajv.compile(writableFunderSchema);

export {
	type Funder,
	type InternallyWritableFunder,
	isWritableFunder,
	type WritableFunder,
};
