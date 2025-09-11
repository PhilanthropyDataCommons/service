import { ajv } from '../ajv';
import { shortCodeSchema } from './ShortCode';
import { idSchema } from './Id';
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
	funderShortCode: ShortCode;
	readonly funder: Funder;
	readonly status: TaskStatus;
	readonly createdAt: string;
	readonly createdBy: KeycloakId;
}

type WritableBulkUploadTask = Writable<BulkUploadTask>;

type InternallyWritableBulkUploadTask = WritableBulkUploadTask &
	Pick<BulkUploadTask, 'status'>;

const writableBulkUploadTaskSchema: JSONSchemaType<WritableBulkUploadTask> = {
	type: 'object',
	properties: {
		sourceId: idSchema,
		proposalsDataFileId: idSchema,
		funderShortCode: {
			...shortCodeSchema,
		},
	},
	required: ['sourceId', 'proposalsDataFileId', 'funderShortCode'],
};

const isWritableBulkUploadTask = ajv.compile(writableBulkUploadTaskSchema);

export {
	type BulkUploadTask,
	type InternallyWritableBulkUploadTask,
	type WritableBulkUploadTask,
	isWritableBulkUploadTask,
	writableBulkUploadTaskSchema,
};
