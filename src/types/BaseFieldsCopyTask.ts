import { ajv } from '../ajv';
import { TaskStatus } from './TaskStatus';
import type { Writable } from './Writable';
import type { JSONSchemaType } from 'ajv';
import type { KeycloakUserId } from './KeycloakUserId';

interface BaseFieldsCopyTask {
	readonly id: number;
	readonly status: TaskStatus;
	pdcApiUrl: string;
	readonly statusUpdatedAt: string;
	readonly createdAt: string;
	readonly createdBy: KeycloakUserId;
}

type WritableBaseFieldsCopyTask = Writable<BaseFieldsCopyTask>;

type InternallyWritableBaseFieldsCopyTask = WritableBaseFieldsCopyTask &
	Pick<BaseFieldsCopyTask, 'status' | 'createdBy'>;

const writableBaseFieldsCopyTaskSchema: JSONSchemaType<WritableBaseFieldsCopyTask> =
	{
		type: 'object',
		properties: {
			pdcApiUrl: {
				type: 'string',
			},
		},
		required: ['pdcApiUrl'],
	};

const isWritableBaseFieldsCopyTask = ajv.compile(
	writableBaseFieldsCopyTaskSchema,
);
export {
	BaseFieldsCopyTask,
	WritableBaseFieldsCopyTask,
	isWritableBaseFieldsCopyTask,
	InternallyWritableBaseFieldsCopyTask,
};
