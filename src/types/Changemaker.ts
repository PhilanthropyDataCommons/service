import { ajv } from '../ajv';
import { KeycloakId, keycloakIdSchema } from './KeycloakId';
import { Writable } from './Writable';
import type { JSONSchemaType } from 'ajv';
import type { ProposalFieldValue } from './ProposalFieldValue';

interface Changemaker {
	readonly id: number;
	taxId: string;
	name: string;
	// We do not really want "undefined" here, only null. See
	// https://github.com/ajv-validator/ajv/issues/2283 and/or
	// https://github.com/ajv-validator/ajv/issues/2163.
	keycloakOrganizationId: KeycloakId | null | undefined;
	readonly fields: ProposalFieldValue[];
	readonly createdAt: string;
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
			nullable: true,
		},
	},
	required: ['taxId', 'name'],
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
	};

const isPartialWritableChangemaker = ajv.compile(
	partialWritableChangemakerSchema,
);
export {
	isWritableChangemaker,
	Changemaker,
	WritableChangemaker,
	writableChangemakerSchema,
	PartialWritableChangemaker,
	partialWritableChangemakerSchema,
	isPartialWritableChangemaker,
};
