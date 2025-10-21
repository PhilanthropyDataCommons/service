import { generateLoadItemOperation } from '../generators';
import { decorateWithDownloadUrl } from '../../../decorators/file';
import type { File } from '../../../types';

const loadFile = generateLoadItemOperation<File, [fileId: number]>(
	'files.selectById',
	'File',
	['fileId'],
	decorateWithDownloadUrl,
);

export { loadFile };
