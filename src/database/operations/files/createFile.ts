import { generateCreateItemOperation } from '../generators';
import type { File, InternallyWritableFile } from '../../../types';

const createFile = generateCreateItemOperation<
	File,
	InternallyWritableFile,
	[]
>('files.insertOne', ['name', 'mimeType', 'size', 's3BucketName'], []);

export { createFile };
