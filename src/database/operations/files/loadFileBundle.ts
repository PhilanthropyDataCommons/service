import { generateLoadBundleOperation } from '../generators';
import { decorateWithDownloadUrl } from '../../../decorators/file';
import type { File, KeycloakId } from '../../../types';

const loadFileBundle = generateLoadBundleOperation<
	File,
	[createdBy: KeycloakId | undefined]
>(
	'files.selectWithPagination',
	'files',
	['createdBy'],
	decorateWithDownloadUrl,
);

export { loadFileBundle };
