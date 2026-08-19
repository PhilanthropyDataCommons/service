import { ajv } from '../ajv';
import { idSchema } from './Id';
import { shortCodeSchema } from './ShortCode';
import type { Id } from './Id';
import type { JSONSchemaType } from 'ajv';
import type { BaseField } from './BaseField';
import type { FieldValueBase } from './FieldValueBase';
import type { KeycloakId } from './KeycloakId';
import type { ShortCode } from './ShortCode';
import type { Source } from './Source';
import type { Writable } from './Writable';

interface InitiativeFieldValue extends FieldValueBase {
	readonly initiativeId: Id;
	baseFieldShortCode: ShortCode;
	sourceId: Id;
	readonly baseField: BaseField;
	readonly source: Source;
	readonly createdBy: KeycloakId;
}

type WritableInitiativeFieldValue = Writable<InitiativeFieldValue>;

const writableInitiativeFieldValueSchema: JSONSchemaType<WritableInitiativeFieldValue> =
	{
		type: 'object',
		properties: {
			baseFieldShortCode: shortCodeSchema,
			sourceId: idSchema,
			value: {
				type: 'string',
			},
			goodAsOf: {
				type: 'string',
				/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
				 * This is a gross workaround for the fact that AJV does not support nullable types in TypeScript.
				 * See: https://github.com/ajv-validator/ajv/issues/2163
				 */
				nullable: true as false,
			},
		},
		required: ['baseFieldShortCode', 'sourceId', 'value', 'goodAsOf'],
	};

const isWritableInitiativeFieldValue = ajv.compile(
	writableInitiativeFieldValueSchema,
);

type InternallyWritableInitiativeFieldValue = WritableInitiativeFieldValue &
	Pick<InitiativeFieldValue, 'initiativeId' | 'isValid'>;

type InitiativeFieldValuePatch = Partial<
	Pick<InitiativeFieldValue, 'value' | 'sourceId' | 'goodAsOf'>
>;

const initiativeFieldValuePatchSchema: JSONSchemaType<InitiativeFieldValuePatch> =
	{
		type: 'object',
		properties: {
			value: {
				type: 'string',
				/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
				 * AJV's JSONSchemaType does not properly support nullable for patches.
				 * See https://github.com/ajv-validator/ajv/issues/2163
				 */
				nullable: false as true,
			},
			sourceId: {
				...idSchema,
				/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
				 * AJV's JSONSchemaType does not properly support nullable for patches.
				 * See https://github.com/ajv-validator/ajv/issues/2163
				 */
				nullable: false as true,
			},
			goodAsOf: {
				type: 'string',
				nullable: true,
			},
		},
		additionalProperties: false,
		minProperties: 1,
	};

const isInitiativeFieldValuePatch = ajv.compile(
	initiativeFieldValuePatchSchema,
);

type InternallyWritableInitiativeFieldValuePatch = InitiativeFieldValuePatch &
	Pick<InitiativeFieldValue, 'isValid'>;

export {
	type InitiativeFieldValue,
	type InitiativeFieldValuePatch,
	type InternallyWritableInitiativeFieldValue,
	type InternallyWritableInitiativeFieldValuePatch,
	type WritableInitiativeFieldValue,
	writableInitiativeFieldValueSchema,
	isWritableInitiativeFieldValue,
	isInitiativeFieldValuePatch,
};
