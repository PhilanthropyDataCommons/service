import { ajv } from '../ajv';
import { keycloakIdSchema } from './KeycloakId';
import type { KeycloakId } from './KeycloakId';
import type { Writable } from './Writable';
import type { JSONSchemaType } from 'ajv';
import type { ProposalFieldValue } from './ProposalFieldValue';

interface ShallowChangemaker {
	readonly id: number;
	taxId: string;
	name: string;
	keycloakOrganizationId: KeycloakId | null;
	readonly createdAt: string;
}

interface Changemaker extends ShallowChangemaker {
	readonly fiscalSponsors: ShallowChangemaker[];
	readonly fields: ProposalFieldValue[];
}

type WritableChangemaker = Writable<Changemaker>;

const writableChangemakerSchema: JSONSchemaType<WritableChangemaker> = {
	type: 'object',
	properties: {
		taxId: {
			type: 'string',
		},
		name: {
			type: 'string',
		},
		keycloakOrganizationId: {
			...keycloakIdSchema,
			// This is a gross workaround for the fact that AJV does not support nullable types in TypeScript.
			// See: https://github.com/ajv-validator/ajv/issues/2163
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			nullable: true as false,
		},
	},
	required: ['taxId', 'name', 'keycloakOrganizationId'],
};

const isWritableChangemaker = ajv.compile(writableChangemakerSchema);

type PartialWritableChangemaker = Partial<WritableChangemaker>;

const partialWritableChangemakerSchema: JSONSchemaType<PartialWritableChangemaker> =
	{
		type: 'object',
		properties: {
			taxId: {
				type: 'string',
				nullable: true,
			},
			name: {
				type: 'string',
				nullable: true,
			},
			keycloakOrganizationId: {
				...keycloakIdSchema,
				nullable: true,
			},
		},
		additionalProperties: false,
		minProperties: 1,
	};

const isPartialWritableChangemaker = ajv.compile(
	partialWritableChangemakerSchema,
);
export {
	isWritableChangemaker,
	type Changemaker,
	type ShallowChangemaker,
	type WritableChangemaker,
	writableChangemakerSchema,
	type PartialWritableChangemaker,
	partialWritableChangemakerSchema,
	isPartialWritableChangemaker,
};
