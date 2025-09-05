import { generateCreateOrUpdateItemOperation } from '../generators';
import type { File, InternallyWritableFile } from '../../../types';

const createFile = generateCreateOrUpdateItemOperation<
	File,
	InternallyWritableFile,
	[]
>('files.insertOne', ['name', 'mimeType', 'size', 's3BucketName'], []);

export { createFile };
