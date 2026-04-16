import { generateLoadItemOperation } from '../generators';
import { decorateWithDownloadUrl } from '../../../decorators/file';
import type { File, Id } from '../../../types';

const loadFile = generateLoadItemOperation<File, [fileId: Id]>(
	'files.selectById',
	'File',
	['fileId'],
	decorateWithDownloadUrl,
);

export { loadFile };
