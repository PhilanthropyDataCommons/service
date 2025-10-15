import { generatePresignedDownloadUrl } from '../s3';
import { getLogger } from '../logger';
import { isShallowFile } from '../types';
import type { Request, Response, NextFunction } from 'express';

const logger = getLogger(__filename);
const ZERO_LENGTH = 0;

/**
 * Recursively traverses an object/array and adds downloadUrl to any File objects found.
 * Modifies the data structure in place.
 */
const decorateDataWithDownloadUrls = async (data: unknown): Promise<void> => {
	if (data === null || data === undefined) {
		return;
	}

	if (Array.isArray(data)) {
		await Promise.all(
			data.map(async (item) => {
				await decorateDataWithDownloadUrls(item);
			}),
		);
		return;
	}

	if (typeof data === 'object') {
		if (isShallowFile(data)) {
			try {
				const downloadUrl = await generatePresignedDownloadUrl(
					data.storageKey,
					data.s3BucketName,
				);
				data.downloadUrl = downloadUrl;
			} catch (error: unknown) {
				// If we fail to generate a presigned URL, log the error but don't fail the request
				logger.error(
					{ error, fileId: obj.id },
					'Failed to generate download URL for file',
				);
			}
		}

		// Recursively process all nested objects/arrays
		await Promise.all(
			Object.values(data).map(async (value) => {
				await decorateDataWithDownloadUrls(value);
			}),
		);
	}
};

const isJsonContentType = (contentType: unknown): boolean => contentType?.toString() === 'application/json'

/**
 * Express middleware that intercepts JSON responses and automatically adds
 * presigned download URLs to any File objects in the response body.
 *
 * This middleware works by wrapping the res.send() and res.json() methods
 * to detect File objects and decorate them with downloadUrl fields before
 * sending the response.
 */
export const addFileDownloadUrls = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const originalSend = res.send.bind(res);
	const originalJson = res.json.bind(res);

	res.json = function (body: unknown) {
		const contentType = res.getHeader('content-type');
		if (!isJsonContentType(contentType)) {
			return originalJson(body);
		}

		decorateDataWithDownloadUrls(body)
			.then(() => {
				originalJson(body);
			})
			.catch((error: unknown) => {
				// If decoration fails, log but still send the response
				logger.error({ error }, 'Error decorating files with download URLs');
				originalJson(body);
			});

		return res;
	};

	res.send = function (body: unknown) {
		// Only process JSON responses
		const contentType = res.getHeader('content-type');
		if (!isJsonContentType(contentType)) {
			return originalSend(body);
		}

		// If body is a string, try to parse it as JSON
		let parsedBody = body;
		if (typeof body === 'string') {
			try {
				parsedBody = JSON.parse(body);
			} catch {
				// Not valid JSON, just send as-is
				return originalSend(body);
			}
		}

		// Process the body asynchronously, then send
		void decorateFilesWithDownloadUrls(parsedBody)
			.then(() => {
				// Re-stringify if original was a string
				const finalBody =
					typeof body === 'string' ? JSON.stringify(parsedBody) : parsedBody;
				originalSend(finalBody);
			})
			.catch((error: unknown) => {
				// If decoration fails, log but still send the response
				logger.error({ error }, 'Error decorating files with download URLs');
				originalSend(body);
			});

		return res;
	};

	next();
};
