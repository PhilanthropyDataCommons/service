import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface Organization {
	readonly id: number;
	employerIdentificationNumber: string;
	name: string;
	readonly createdAt: Date;
}

type WritableOrganization = Writable<Organization>;

const writableOrganizationSchema: JSONSchemaType<WritableOrganization> = {
	type: 'object',
	properties: {
		employerIdentificationNumber: {
			type: 'string',
		},
		name: {
			type: 'string',
		},
	},
	required: ['employerIdentificationNumber', 'name'],
};

const isWritableOrganization = ajv.compile(writableOrganizationSchema);

export {
	isWritableOrganization,
	Organization,
	WritableOrganization,
	writableOrganizationSchema,
};
