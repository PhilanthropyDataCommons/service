import { generateLoadItemOperation } from '../generators';
import type { EphemeralAuthContext, Id } from '../../../types';

const loadEphemeralAuthContextByBulkUploadTaskId = generateLoadItemOperation<
	EphemeralAuthContext,
	[bulkUploadTaskId: Id]
>('ephemeralAuthContexts.selectByBulkUploadTaskId', 'EphemeralAuthContext', [
	'bulkUploadTaskId',
]);

export { loadEphemeralAuthContextByBulkUploadTaskId };
