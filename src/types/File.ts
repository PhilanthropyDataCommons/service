import { ajv } from '../ajv';
import { keycloakIdSchema, type KeycloakId } from './KeycloakId';
import type { JSONSchemaType } from 'ajv';
import type { PresignedPost } from '@aws-sdk/s3-presigned-post';
import type { Writable } from './Writable';
import type { Id } from './Id';
import type { S3Bucket } from './S3Bucket';

interface File {
	readonly id: Id;
	name: string;
	readonly storageKey: string;
	mimeType: string;
	size: number;
	readonly s3BucketName: string;
	readonly s3Bucket: S3Bucket;
	readonly presignedPost?: PresignedPost;
	readonly downloadUrl?: string;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableFile = Writable<File>;

type InternallyWritableFile = WritableFile & Pick<File, 's3BucketName'>;

type ShallowFile = Omit<File, 'presignedPost' | 's3Bucket' | 'downloadUrl'>;

const writableFileSchema: JSONSchemaType<WritableFile> = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		mimeType: {
			type: 'string',
		},
		size: {
			type: 'integer',
			minimum: 0,
		},
	},
	required: ['name', 'mimeType', 'size'],
};

const isWritableFile = ajv.compile(writableFileSchema);

const shallowFileSchema: JSONSchemaType<ShallowFile> = {
	type: 'object',
	properties: {
		id: {
			type: 'integer',
		},
		name: {
			type: 'string',
		},
		storageKey: {
			type: 'string',
		},
		mimeType: {
			type: 'string',
		},
		size: {
			type: 'integer',
		},
		s3BucketName: {
			type: 'string',
		},
		createdBy: keycloakIdSchema,
		createdAt: {
			type: 'string',
		},
	},
	required: [
		'id',
		'name',
		'storageKey',
		'mimeType',
		'size',
		's3BucketName',
		'createdBy',
		'createdAt',
	],
	additionalProperties: true,
};

const isShallowFile = ajv.compile(shallowFileSchema);

export {
	type File,
	type WritableFile,
	type InternallyWritableFile,
	writableFileSchema,
	isWritableFile,
	isShallowFile,
};
