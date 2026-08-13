import { ajv } from '../ajv';
import { idSchema } from './Id';
import type { Id } from './Id';
import type { JSONSchemaType } from 'ajv';
import type { KeycloakId } from './KeycloakId';
import type { Writable } from './Writable';

interface Initiative {
	readonly id: Id;
	changemakerId: Id;
	title: string;
	readonly createdAt: string;
	readonly createdBy: KeycloakId;
}

type WritableInitiative = Writable<Initiative>;

const writableInitiativeSchema: JSONSchemaType<WritableInitiative> = {
	type: 'object',
	properties: {
		changemakerId: idSchema,
		title: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['changemakerId', 'title'],
};

const isWritableInitiative = ajv.compile(writableInitiativeSchema);

type InitiativePatch = Partial<Pick<Initiative, 'title'>>;

const initiativePatchSchema: JSONSchemaType<InitiativePatch> = {
	type: 'object',
	properties: {
		title: {
			type: 'string',
			minLength: 1,
			/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
			 * AJV's JSONSchemaType does not properly support nullable for patches.
			 * See https://github.com/ajv-validator/ajv/issues/2163
			 */
			nullable: false as true,
		},
	},
	additionalProperties: false,
	minProperties: 1,
};

const isInitiativePatch = ajv.compile(initiativePatchSchema);

export {
	type Initiative,
	type InitiativePatch,
	type WritableInitiative,
	writableInitiativeSchema,
	isWritableInitiative,
	isInitiativePatch,
};
