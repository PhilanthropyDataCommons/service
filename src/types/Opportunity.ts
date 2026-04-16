import { ajv } from '../ajv';
import { shortCodeSchema } from './ShortCode';
import type { Id } from './Id';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';
import type { Funder } from './Funder';
import type { KeycloakId } from './KeycloakId';

interface Opportunity {
	readonly id: Id;
	title: string;
	funderShortCode: ShortCode;
	readonly funder: Funder;
	readonly createdAt: string;
	readonly createdBy: KeycloakId;
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
	type Opportunity,
	type WritableOpportunity,
	writableOpportunitySchema,
	isWritableOpportunity,
};
