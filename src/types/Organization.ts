import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface Organization {
	readonly id: number;
	taxId: string;
	name: string;
	readonly createdAt: string;
}

type WritableOrganization = Writable<Organization>;

const writableOrganizationSchema: JSONSchemaType<WritableOrganization> = {
	type: 'object',
	properties: {
		taxId: {
			type: 'string',
		},
		name: {
			type: 'string',
		},
	},
	required: ['taxId', 'name'],
};

const isWritableOrganization = ajv.compile(writableOrganizationSchema);

export {
	isWritableOrganization,
	Organization,
	WritableOrganization,
	writableOrganizationSchema,
};
