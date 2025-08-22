import { ajv } from '../ajv';
import type { Uuid } from './Uuid';
import type { KeycloakId } from './KeycloakId';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface File {
	readonly uuid: Uuid;
	mimeType: string;
	size: number;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableFile = Writable<File>;

const writableFileSchema: JSONSchemaType<WritableFile> = {
	type: 'object',
	properties: {
		mimeType: {
			type: 'string',
		},
		size: {
			type: 'integer',
			minimum: 0,
		},
	},
	required: ['mimeType', 'size'],
};

const isWritableFile = ajv.compile(writableFileSchema);

export { type File, type WritableFile, writableFileSchema, isWritableFile };
