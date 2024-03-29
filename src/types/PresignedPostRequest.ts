import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { PresignedPost } from '@aws-sdk/s3-presigned-post';

export interface PresignedPostRequest {
	fileType: string;
	fileSize: number;
	presignedPost: PresignedPost;
}

export type PresignedPostRequestWrite = Omit<
	PresignedPostRequest,
	'presignedPost'
>;

export const presignedPostRequestSchema: JSONSchemaType<PresignedPostRequest> =
	{
		type: 'object',
		properties: {
			fileType: {
				type: 'string',
			},
			fileSize: {
				type: 'integer',
				minimum: 0,
			},
			presignedPost: {
				type: 'object',
				properties: {
					url: {
						type: 'string',
					},
					fields: {
						type: 'object',
						properties: {
							key: {
								type: 'string',
							},
						},
						required: ['key'],
					},
				},
				required: ['url', 'fields'],
			},
		},
		required: ['fileType', 'fileSize'],
	};

export const presignedPostRequestWriteSchema: JSONSchemaType<PresignedPostRequestWrite> =
	{
		type: 'object',
		properties: {
			fileType: {
				type: 'string',
			},
			fileSize: {
				type: 'integer',
				minimum: 0,
			},
		},
		required: ['fileType', 'fileSize'],
	};

export const isPresignedPostRequest = ajv.compile(presignedPostRequestSchema);

export const isPresignedPostRequestWrite = ajv.compile(
	presignedPostRequestSchema,
);
