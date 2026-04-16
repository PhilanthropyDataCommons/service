import { ajv } from '../ajv';
import { idSchema } from './Id';
import type { Id } from './Id';
import type { JSONSchemaType } from 'ajv';
import type { BaseField } from './BaseField';
import type { ChangemakerFieldValueBatch } from './ChangemakerFieldValueBatch';
import type { FieldValueBase } from './FieldValueBase';
import type { Writable } from './Writable';

interface ChangemakerFieldValue extends FieldValueBase {
	changemakerId: Id;
	baseFieldShortCode: string;
	batchId: Id;
	readonly baseField: BaseField;
	readonly batch: ChangemakerFieldValueBatch;
}

type WritableChangemakerFieldValue = Writable<ChangemakerFieldValue>;

const writableChangemakerFieldValueSchema: JSONSchemaType<WritableChangemakerFieldValue> =
	{
		type: 'object',
		properties: {
			changemakerId: idSchema,
			baseFieldShortCode: {
				type: 'string',
			},
			batchId: idSchema,
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
		required: [
			'changemakerId',
			'baseFieldShortCode',
			'batchId',
			'value',
			'goodAsOf',
		],
	};

const isWritableChangemakerFieldValue = ajv.compile(
	writableChangemakerFieldValueSchema,
);

type InternallyWritableChangemakerFieldValue = WritableChangemakerFieldValue &
	Pick<ChangemakerFieldValue, 'isValid'>;

export {
	type ChangemakerFieldValue,
	type InternallyWritableChangemakerFieldValue,
	type WritableChangemakerFieldValue,
	isWritableChangemakerFieldValue,
	writableChangemakerFieldValueSchema,
};
