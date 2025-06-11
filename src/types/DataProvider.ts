import { ajv } from '../ajv';
import { KeycloakId, keycloakIdSchema } from './KeycloakId';
import { Writable } from './Writable';
import type { JSONSchemaType } from 'ajv';
import type { ShortCode } from './ShortCode';

interface DataProvider {
	readonly shortCode: ShortCode;
	name: string;
	// We do not really want "undefined" here, only null. See
	// https://github.com/ajv-validator/ajv/issues/2283 and/or
	// https://github.com/ajv-validator/ajv/issues/2163.
	keycloakOrganizationId: KeycloakId | null | undefined;
	readonly createdAt: string;
}

type WritableDataProvider = Writable<DataProvider>;

type InternallyWritableDataProvider = WritableDataProvider &
	Pick<DataProvider, 'shortCode'>;

const writableDataProviderSchema: JSONSchemaType<WritableDataProvider> = {
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

const isWritableDataProvider = ajv.compile(writableDataProviderSchema);

export {
	type DataProvider,
	type InternallyWritableDataProvider,
	isWritableDataProvider,
	type WritableDataProvider,
};
