import { ajv } from '../ajv';
import { uuidSchema } from './Uuid';
import type { JSONSchemaType } from 'ajv';
import type { PresignedPost } from '@aws-sdk/s3-presigned-post';
import type { Uuid } from './Uuid';

export interface PresignedPostRequest {
	fileUuid: Uuid;
	presignedPost: PresignedPost;
}

export type PresignedPostRequestWrite = Omit<
	PresignedPostRequest,
	'presignedPost'
>;

export const presignedPostRequestWriteSchema: JSONSchemaType<PresignedPostRequestWrite> =
	{
		type: 'object',
		properties: {
			fileUuid: uuidSchema,
		},
		required: ['fileUuid'],
	};

export const isPresignedPostRequestWrite = ajv.compile(
	presignedPostRequestWriteSchema,
);
