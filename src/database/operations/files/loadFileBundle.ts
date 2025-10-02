import { generateLoadBundleOperation } from '../generators';
import type { File, KeycloakId } from '../../../types';

const loadFileBundle = generateLoadBundleOperation<
	File,
	[createdBy: KeycloakId | undefined]
>('files.selectWithPagination', 'files', ['createdBy']);

export { loadFileBundle };
