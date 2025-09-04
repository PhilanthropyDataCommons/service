import { createFile } from '../../database';
import type { TinyPg } from 'tinypg';
import type { AuthContext, InternallyWritableFile, File } from '../../types';

const createTestFile = async (
	db: TinyPg,
	authContext: AuthContext,
	overrideValues?: Partial<InternallyWritableFile>,
): Promise<File> => {
	const defaultValues = {
		bucketName: 'default-bucket',
		bucketRegion: 'us-east-1',
		name: 'test.csv',
		mimeType: 'text/csv',
		size: 123,
	};
	return await createFile(db, authContext, {
		...defaultValues,
		...overrideValues,
	});
};

export { createTestFile };
