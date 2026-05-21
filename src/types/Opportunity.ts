import { ajv } from '../ajv';
import { shortCodeSchema } from './ShortCode';
import type { Id } from './Id';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';
import type { Funder } from './Funder';
import type { KeycloakId } from './KeycloakId';
import type { TerminologySet } from './TerminologySet';

interface Opportunity {
	readonly id: Id;
	title: string;
	funderShortCode: ShortCode;
	readonly funder: Funder;
	// We do not really want "undefined" here, only null. See
	// https://github.com/ajv-validator/ajv/issues/2283 and/or
	// https://github.com/ajv-validator/ajv/issues/2163.
	terminologySetId: Id | null | undefined;
	readonly terminologySet: TerminologySet | null | undefined;
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
		terminologySetId: {
			type: 'integer',
			nullable: true,
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
