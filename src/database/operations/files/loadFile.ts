import { generateLoadItemOperation } from '../generators';
import type { File } from '../../../types';

const loadFile = generateLoadItemOperation<File, [fileId: number]>(
	'files.selectById',
	'File',
	['fileId'],
);

export { loadFile };
