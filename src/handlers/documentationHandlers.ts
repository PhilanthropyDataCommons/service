import path from 'path';
import fs from 'fs/promises';
import { issuer } from '../auth/jwtOptions';
import type { Request, Response } from 'express';

const readAndExpandDocumentationFile = async (
	relativeFilePath: string,
): Promise<string> => {
	const absoluteFilePath = path.join(__dirname, '../openapi', relativeFilePath);
	const rawContent = await fs.readFile(absoluteFilePath, 'utf8');
	const expandedContent = rawContent.replace(/{{AUTH_ISSUER}}/g, issuer);
	return expandedContent;
};

const expandedDocumentationCache: Record<string, string> = {};
const getExpandedDocumentation = async (
	relativeFilePath: string,
): Promise<string> => {
	const { [relativeFilePath]: cachedValue } = expandedDocumentationCache;
	if (cachedValue) {
		return cachedValue;
	}
	const expandedContent =
		await readAndExpandDocumentationFile(relativeFilePath);
	expandedDocumentationCache[relativeFilePath] = expandedContent;
	return expandedContent;
};

const getRootApiSpec = async (req: Request, res: Response): Promise<void> => {
	const expandedDocumentation = await getExpandedDocumentation('api.json');
	res.type('application/json');
	res.set(
		'Content-Length',
		Buffer.byteLength(expandedDocumentation, 'utf8').toString(),
	);
	res.send(expandedDocumentation);
};

const getAuthApiSpec = async (req: Request, res: Response): Promise<void> => {
	const expandedDocumentation = await getExpandedDocumentation(
		'components/securitySchemes/auth.json',
	);
	res.type('application/json');
	res.set(
		'Content-Length',
		Buffer.byteLength(expandedDocumentation, 'utf8').toString(),
	);
	res.send(expandedDocumentation);
};

export const documentationHandlers = { getRootApiSpec, getAuthApiSpec };
