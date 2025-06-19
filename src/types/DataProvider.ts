import { ajv } from '../ajv';
import { keycloakIdSchema } from './KeycloakId';
import type { KeycloakId } from './KeycloakId';
import type { Writable } from './Writable';
import type { JSONSchemaType } from 'ajv';
import type { ShortCode } from './ShortCode';

interface DataProvider {
	readonly shortCode: ShortCode;
	name: string;
	keycloakOrganizationId: KeycloakId | null;
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
			// This is a gross workaround for the fact that AJV does not support nullable types in TypeScript.
			// See: https://github.com/ajv-validator/ajv/issues/2163
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			nullable: true as false,
		},
	},
	required: ['name', 'keycloakOrganizationId'],
};

const isWritableDataProvider = ajv.compile(writableDataProviderSchema);

export {
	type DataProvider,
	type InternallyWritableDataProvider,
	isWritableDataProvider,
	type WritableDataProvider,
};
