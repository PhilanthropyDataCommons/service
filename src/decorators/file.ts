import { generatePresignedDownloadUrl } from '../s3';
import type { File } from '../types/File';

const decorateWithDownloadUrl = async (file: File): Promise<File> => {
	try {
		const downloadUrl = await generatePresignedDownloadUrl(
			file.storageKey,
			file.s3BucketName,
		);
		return {
			...file,
			downloadUrl,
		};
	} catch (error: unknown) {
		throw new Error(`Failed to generate download URL for file ${file.id}`, {
			cause: error,
		});
	}
};

export { decorateWithDownloadUrl };
