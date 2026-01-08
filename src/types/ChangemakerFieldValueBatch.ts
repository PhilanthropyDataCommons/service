import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { KeycloakId } from './KeycloakId';
import type { Source } from './Source';
import type { Writable } from './Writable';

interface ChangemakerFieldValueBatch {
	readonly id: number;
	sourceId: number;
	notes: string | null;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
	readonly source: Source;
}

type WritableChangemakerFieldValueBatch = Writable<ChangemakerFieldValueBatch>;

const writableChangemakerFieldValueBatchSchema: JSONSchemaType<WritableChangemakerFieldValueBatch> =
	{
		type: 'object',
		properties: {
			sourceId: {
				type: 'integer',
			},
			notes: {
				type: 'string',
				/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
				 * This is a gross workaround for the fact that AJV does not support nullable types in TypeScript.
				 * See: https://github.com/ajv-validator/ajv/issues/2163
				 */
				nullable: true as false,
			},
		},
		required: ['sourceId'],
	};

const isWritableChangemakerFieldValueBatch = ajv.compile(
	writableChangemakerFieldValueBatchSchema,
);

export {
	type ChangemakerFieldValueBatch,
	type WritableChangemakerFieldValueBatch,
	writableChangemakerFieldValueBatchSchema,
	isWritableChangemakerFieldValueBatch,
};
