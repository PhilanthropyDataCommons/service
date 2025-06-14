import { ajv } from '../ajv';
import { keycloakIdSchema } from './KeycloakId';
import type { KeycloakId } from './KeycloakId';
import type { Writable } from './Writable';
import type { JSONSchemaType } from 'ajv';
import type { ShortCode } from './ShortCode';

interface Funder {
	readonly shortCode: ShortCode;
	name: string;
	// We do not really want "undefined" here, only null. See
	// https://github.com/ajv-validator/ajv/issues/2283 and/or
	// https://github.com/ajv-validator/ajv/issues/2163.
	keycloakOrganizationId: KeycloakId | null | undefined;
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
			nullable: true,
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
