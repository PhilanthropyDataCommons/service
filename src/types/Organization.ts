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

const organizationSchema: JSONSchemaType<Organization> = {
	type: 'object',
	properties: {
		id: {
			type: 'integer',
		},
		employerIdentificationNumber: {
			type: 'string',
		},
		name: {
			type: 'string',
		},
		createdAt: {
			type: 'object',
			required: [],
			instanceof: 'Date',
		},
	},
	required: ['id', 'employerIdentificationNumber', 'name', 'createdAt'],
};

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

const isOrganization = ajv.compile(organizationSchema);
const isWritableOrganization = ajv.compile(writableOrganizationSchema);

export {
	isOrganization,
	isWritableOrganization,
	Organization,
	organizationSchema,
	WritableOrganization,
	writableOrganizationSchema,
};
