import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { HTTP_STATUS } from '../constants';
import { allNoLeaks } from '../promises';
import agentSkillIndex from '../skills/index.json';
import type { Request, Response } from 'express';

const getAgentSkillDigest = async (
	relativeFilePath: string,
): Promise<string> => {
	const content = await fs.readFile(
		path.join(__dirname, '../skills', relativeFilePath),
	);
	return `sha256:${createHash('sha256').update(content).digest('hex')}`;
};

const addAgentSkillDigests = async (): Promise<object> => ({
	...agentSkillIndex,
	skills: await allNoLeaks(
		agentSkillIndex.skills.map(async (skill) => ({
			...skill,
			digest: await getAgentSkillDigest(skill.url),
		})),
	),
});

let agentSkillIndexWithDigests: Promise<object> | null = null;

const getAgentSkillIndex = async (
	req: Request,
	res: Response,
): Promise<void> => {
	agentSkillIndexWithDigests ??= addAgentSkillDigests().catch(
		(error: unknown) => {
			agentSkillIndexWithDigests = null;
			throw error;
		},
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(await agentSkillIndexWithDigests);
};

const agentSkillsHandlers = { getAgentSkillIndex };

export { agentSkillsHandlers };
