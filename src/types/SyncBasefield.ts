import { ajv } from '../ajv';
import type { Writable } from './Writable';
import type { JSONSchemaType } from 'ajv';
import type { KeycloakUserId } from './KeycloakUserId';

enum SyncBasefieldStatus {
	PENDING = 'pending',
	IN_PROGRESS = 'in_progress',
	COMPLETED = 'completed',
	FAILED = 'failed',
	CANCELED = 'canceled',
}

interface SyncBaseField {
	readonly id: number;
	readonly status: SyncBasefieldStatus;
	synchronizationUrl: string;
	readonly statusUpdatedAt: string;
	readonly createdAt: string;
	readonly createdBy: KeycloakUserId;
}

type WritableSyncBaseField = Writable<SyncBaseField>;

type InternallyWritableSyncBaseField = WritableSyncBaseField &
	Pick<SyncBaseField, 'status' | 'statusUpdatedAt' | 'createdBy'>;

const writableSyncBaseFieldSchema: JSONSchemaType<WritableSyncBaseField> = {
	type: 'object',
	properties: {
		synchronizationUrl: {
			type: 'string',
		},
	},
	required: ['synchronizationUrl'],
};

const isWritableSyncBaseField = ajv.compile(writableSyncBaseFieldSchema);
export {
	SyncBaseField,
	WritableSyncBaseField,
	isWritableSyncBaseField,
	InternallyWritableSyncBaseField,
	SyncBasefieldStatus,
};
