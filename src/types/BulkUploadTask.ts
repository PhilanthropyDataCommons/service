import { ajv } from '../ajv';
import { idSchema } from './Id';
import type { ApplicationForm } from './ApplicationForm';
import type { BulkUploadLog } from './BulkUploadLog';
import type { TaskStatus } from './TaskStatus';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { Source } from './Source';
import type { KeycloakId } from './KeycloakId';
import type { File } from './File';
import type { Id } from './Id';
import type { User } from './User';

interface BulkUploadTask {
	readonly id: number;
	sourceId: Id;
	readonly source: Source;
	applicationFormId: Id;
	readonly applicationForm: ApplicationForm;
	proposalsDataFileId: Id;
	readonly proposalsDataFile: File;
	attachmentsArchiveFileId: Id | null;
	readonly attachmentsArchiveFile: File | null;
	readonly status: TaskStatus;
	readonly createdAt: string;
	readonly createdBy: KeycloakId;
	readonly createdByUser: User;
	readonly logs: BulkUploadLog[];
}

type WritableBulkUploadTask = Writable<BulkUploadTask>;

type InternallyWritableBulkUploadTask = WritableBulkUploadTask &
	Pick<BulkUploadTask, 'status'>;

const writableBulkUploadTaskSchema: JSONSchemaType<WritableBulkUploadTask> = {
	type: 'object',
	properties: {
		sourceId: idSchema,
		applicationFormId: idSchema,
		proposalsDataFileId: idSchema,
		attachmentsArchiveFileId: {
			...idSchema,
			/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
			 * This is a gross workaround for the fact that AJV does not support nullable types in TypeScript.
			 * See: https://github.com/ajv-validator/ajv/issues/2163
			 */
			nullable: true as false,
		},
	},
	required: [
		'sourceId',
		'applicationFormId',
		'proposalsDataFileId',
		'attachmentsArchiveFileId',
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
