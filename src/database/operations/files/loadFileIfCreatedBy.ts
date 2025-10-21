import { generateLoadItemOperation } from '../generators';
import { decorateWithDownloadUrl } from '../../../decorators/file';
import type { File, KeycloakId } from '../../../types';

const loadFileIfCreatedBy = generateLoadItemOperation<
	File,
	[fileId: number, createdBy: KeycloakId]
>('files.selectById', 'File', ['fileId', 'createdBy'], decorateWithDownloadUrl);

export { loadFileIfCreatedBy };
