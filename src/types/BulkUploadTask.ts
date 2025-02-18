import { ajv } from '../ajv';
import { TaskStatus } from './TaskStatus';
import { shortCodeSchema } from './ShortCode';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { Source } from './Source';
import type { KeycloakId } from './KeycloakId';
import type { ShortCode } from './ShortCode';
import type { Funder } from './Funder';

interface BulkUploadTask {
	readonly id: number;
	sourceId: number;
	readonly source: Source;
	fileName: string;
	sourceKey: string;
	funderShortCode: ShortCode;
	readonly funder: Funder;
	readonly status: TaskStatus;
	readonly fileSize?: number | null; // see https://github.com/ajv-validator/ajv/issues/2163
	readonly createdAt: string;
	readonly createdBy: KeycloakId;
}

type WritableBulkUploadTask = Writable<BulkUploadTask>;

type InternallyWritableBulkUploadTask = WritableBulkUploadTask &
	Pick<BulkUploadTask, 'status' | 'fileSize' | 'createdBy'>;

const writableBulkUploadTaskSchema: JSONSchemaType<WritableBulkUploadTask> = {
	type: 'object',
	properties: {
		sourceId: {
			type: 'integer',
		},
		fileName: {
			type: 'string',
			pattern: '^.+\\.csv$',
		},
		sourceKey: {
			type: 'string',
			minLength: 1,
		},
		funderShortCode: {
			...shortCodeSchema,
		},
	},
	required: ['sourceId', 'fileName', 'sourceKey', 'funderShortCode'],
};

const isWritableBulkUploadTask = ajv.compile(writableBulkUploadTaskSchema);

export {
	BulkUploadTask,
	InternallyWritableBulkUploadTask,
	WritableBulkUploadTask,
	isWritableBulkUploadTask,
	writableBulkUploadTaskSchema,
};
