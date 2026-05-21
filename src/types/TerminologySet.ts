import { ajv } from '../ajv';
import { shortCodeSchema } from './ShortCode';
import type { Id } from './Id';
import type { JSONSchemaType } from 'ajv';
import type { KeycloakId } from './KeycloakId';
import type { ShortCode } from './ShortCode';
import type { Writable } from './Writable';

interface TerminologySet {
	readonly id: Id;
	funderShortCode: ShortCode;
	name: string;
	// We do not really want "undefined" here, only null. See
	// https://github.com/ajv-validator/ajv/issues/2283 and/or
	// https://github.com/ajv-validator/ajv/issues/2163.
	opportunityLabel: string | null | undefined;
	opportunitiesLabel: string | null | undefined;
	applicationFormLabel: string | null | undefined;
	applicationFormsLabel: string | null | undefined;
	proposalLabel: string | null | undefined;
	proposalsLabel: string | null | undefined;
	readonly createdAt: string;
	readonly createdBy: KeycloakId;
}

type WritableTerminologySet = Writable<TerminologySet>;

const writableTerminologySetSchema: JSONSchemaType<WritableTerminologySet> = {
	type: 'object',
	properties: {
		funderShortCode: {
			...shortCodeSchema,
		},
		name: {
			type: 'string',
			minLength: 1,
		},
		opportunityLabel: {
			type: 'string',
			nullable: true,
		},
		opportunitiesLabel: {
			type: 'string',
			nullable: true,
		},
		applicationFormLabel: {
			type: 'string',
			nullable: true,
		},
		applicationFormsLabel: {
			type: 'string',
			nullable: true,
		},
		proposalLabel: {
			type: 'string',
			nullable: true,
		},
		proposalsLabel: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['funderShortCode', 'name'],
};

const isWritableTerminologySet = ajv.compile(writableTerminologySetSchema);

type TerminologySetPatch = Partial<
	Pick<
		TerminologySet,
		| 'name'
		| 'opportunityLabel'
		| 'opportunitiesLabel'
		| 'applicationFormLabel'
		| 'applicationFormsLabel'
		| 'proposalLabel'
		| 'proposalsLabel'
	>
>;

const terminologySetPatchSchema: JSONSchemaType<TerminologySetPatch> = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
			minLength: 1,
			/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
			 * AJV's JSONSchemaType does not properly support nullable for patches.
			 * See https://github.com/ajv-validator/ajv/issues/2163
			 */
			nullable: false as true,
		},
		opportunityLabel: {
			type: 'string',
			nullable: true,
		},
		opportunitiesLabel: {
			type: 'string',
			nullable: true,
		},
		applicationFormLabel: {
			type: 'string',
			nullable: true,
		},
		applicationFormsLabel: {
			type: 'string',
			nullable: true,
		},
		proposalLabel: {
			type: 'string',
			nullable: true,
		},
		proposalsLabel: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
	minProperties: 1,
};

const isTerminologySetPatch = ajv.compile(terminologySetPatchSchema);

export {
	type TerminologySet,
	type TerminologySetPatch,
	type WritableTerminologySet,
	writableTerminologySetSchema,
	isWritableTerminologySet,
	isTerminologySetPatch,
};
