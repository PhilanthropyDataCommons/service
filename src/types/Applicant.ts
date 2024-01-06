import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface Applicant {
	id: number;
	externalId: string;
	optedIn: boolean;
	createdAt: Date;
}

export const applicantSchema: JSONSchemaType<Applicant> = {
	type: 'object',
	properties: {
		id: {
			type: 'integer',
		},
		externalId: {
			type: 'string',
		},
		optedIn: {
			type: 'boolean',
		},
		createdAt: {
			type: 'object',
			required: [],
			instanceof: 'Date',
		},
	},
	required: ['id', 'externalId', 'optedIn', 'createdAt'],
};

export const isApplicant = ajv.compile(applicantSchema);

const applicantArraySchema: JSONSchemaType<Applicant[]> = {
	type: 'array',
	items: applicantSchema,
};

export const isApplicantArray = ajv.compile(applicantArraySchema);
