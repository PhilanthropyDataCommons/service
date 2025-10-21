import { ajv } from '../ajv';
import { shortCodeSchema } from './ShortCode';
import { idSchema } from './Id';
import type { ApplicationForm } from './ApplicationForm';
import type { BulkUploadLog } from './BulkUploadLog';
import type { TaskStatus } from './TaskStatus';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { Source } from './Source';
import type { KeycloakId } from './KeycloakId';
import type { ShortCode } from './ShortCode';
import type { Funder } from './Funder';
import type { File } from './File';
import type { Id } from './Id';

interface BulkUploadTask {
	readonly id: number;
	sourceId: Id;
	readonly source: Source;
	proposalsDataFileId: Id;
	readonly proposalsDataFile: File;
	attachmentsArchiveFileId: Id | null;
	readonly attachmentsArchiveFile: File | null;
	funderShortCode: ShortCode | null;
	readonly funder: Funder;
	applicationFormId: Id | null;
	readonly applicationForm: ApplicationForm | null;
	readonly status: TaskStatus;
	readonly createdAt: string;
	readonly createdBy: KeycloakId;
	readonly logs: BulkUploadLog[];
}

type WritableBulkUploadTask = Writable<BulkUploadTask>;

type InternallyWritableBulkUploadTask = WritableBulkUploadTask &
	Pick<BulkUploadTask, 'status'>;

const writableBulkUploadTaskSchema: JSONSchemaType<WritableBulkUploadTask> = {
	type: 'object',
	required: [],
	allOf: [
		{
			type: 'object',
			properties: {
				sourceId: idSchema,
			},
			required: ['sourceId'],
		},
		{
			type: 'object',
			properties: {
				proposalsDataFileId: idSchema,
			},
			required: ['proposalsDataFileId'],
		},
		{
			type: 'object',
			properties: {
				attachmentsArchiveFileId: {
					...idSchema,
					/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
					 * This is a gross workaround for the fact that AJV does not support nullable types in TypeScript.
					 * See: https://github.com/ajv-validator/ajv/issues/2163
					 */
					nullable: true as false,
				},
			},
			required: ['attachmentsArchiveFileId'],
		},
		{
			type: 'object',
			oneOf: [
				{
					type: 'object',
					properties: {
						funderShortCode: {
							...shortCodeSchema,
							/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
							 * This is a gross workaround for the fact that AJV does not support nullable types in TypeScript.
							 * See: https://github.com/ajv-validator/ajv/issues/2163
							 */
							nullable: true as false,
						},
					},
					required: ['funderShortCode'],
				},
				{
					type: 'object',
					properties: {
						applicationFormId: {
							...idSchema,
							/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
							 * This is a gross workaround for the fact that AJV does not support nullable types in TypeScript.
							 * See: https://github.com/ajv-validator/ajv/issues/2163
							 */
							nullable: true as false,
						},
					},
					required: ['applicationFormId'],
				},
			],
		},
	],
};

const isWritableBulkUploadTask = ajv.compile(writableBulkUploadTaskSchema);

export {
	type BulkUploadTask,
	type InternallyWritableBulkUploadTask,
	type WritableBulkUploadTask,
	isWritableBulkUploadTask,
	writableBulkUploadTaskSchema,
};
