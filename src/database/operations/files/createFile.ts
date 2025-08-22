import { generateCreateOrUpdateItemOperation } from '../generators';
import type { File, WritableFile } from '../../../types';

const createFile = generateCreateOrUpdateItemOperation<File, WritableFile, []>(
	'files.insertOne',
	['mimeType', 'size'],
	[],
);

export { createFile };
