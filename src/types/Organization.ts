import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { BaseField } from './BaseField';
import type { ProposalFieldValue } from './ProposalFieldValue';

interface Organization {
	readonly id: number;
	taxId: string;
	name: string;
	// TODO: use a type for values that covers either ProposalFieldValue or ExternalFieldValue.
	// TODO: use something other than Map for better JSONification, e.g. use base field ID as key.
	readonly fieldValues: Map<BaseField, ProposalFieldValue>;
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
