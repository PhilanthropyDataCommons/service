import { generateLoadItemOperation } from '../generators';
import type { File, KeycloakId } from '../../../types';

const loadFileIfCreatedBy = generateLoadItemOperation<
	File,
	[fileId: number, createdBy: KeycloakId]
>('files.selectById', 'File', ['fileId', 'createdBy']);

export { loadFileIfCreatedBy };
