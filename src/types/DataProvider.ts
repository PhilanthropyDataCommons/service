import { ajv } from '../ajv';
import { KeycloakId, keycloakIdSchema } from './KeycloakUserId';
import type { JSONSchemaType } from 'ajv';
import type { ShortCode } from './ShortCode';

interface DataProvider {
	readonly shortCode: ShortCode;
	name: string;
	keycloakOrganizationId?: KeycloakId | null;
	readonly createdAt: string;
}

// Using `Writable` here instead of explicit `Pick` messes up the optional field.
type WritableDataProvider = Pick<
	DataProvider,
	'name' | 'keycloakOrganizationId'
>;

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
	DataProvider,
	InternallyWritableDataProvider,
	isWritableDataProvider,
	WritableDataProvider,
};
