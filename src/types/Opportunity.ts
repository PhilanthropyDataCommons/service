import { ajv } from '../ajv';
import { shortCodeSchema } from './ShortCode';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';
import type { Funder } from './Funder';

interface Opportunity {
	readonly id: number;
	title: string;
	funderShortCode: ShortCode;
	readonly funder: Funder;
	readonly createdAt: string;
}

type WritableOpportunity = Writable<Opportunity>;

const writableOpportunitySchema: JSONSchemaType<WritableOpportunity> = {
	type: 'object',
	properties: {
		title: {
			type: 'string',
		},
		funderShortCode: {
			...shortCodeSchema,
		},
	},
	required: ['title', 'funderShortCode'],
};
const isWritableOpportunity = ajv.compile(writableOpportunitySchema);

export {
	Opportunity,
	WritableOpportunity,
	writableOpportunitySchema,
	isWritableOpportunity,
};
