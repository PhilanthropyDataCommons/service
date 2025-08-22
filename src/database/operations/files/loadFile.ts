import { generateLoadItemOperation } from '../generators';
import type { File, Uuid } from '../../../types';

const loadFile = generateLoadItemOperation<File, [fileUuid: Uuid]>(
	'files.selectByUuid',
	'File',
	['fileUuid'],
);

export { loadFile };
