import { generateLoadItemOperation } from '../generators';
import { decorateWithDownloadUrl } from '../../../decorators/file';
import type { File, Id, KeycloakId } from '../../../types';

const loadFileIfCreatedBy = generateLoadItemOperation<
	File,
	[fileId: Id, createdBy: KeycloakId]
>('files.selectById', 'File', ['fileId', 'createdBy'], decorateWithDownloadUrl);

export { loadFileIfCreatedBy };
