import path from 'node:path';
import express from 'express';
import { agentSkillsHandlers } from '../handlers/agentSkillsHandlers';

const agentSkillsRouter = express.Router();

agentSkillsRouter.get('/index.json', agentSkillsHandlers.getAgentSkillIndex);
agentSkillsRouter.use(
	'/',
	express.static(path.join(__dirname, '../skills'), { redirect: false }),
);

export { agentSkillsRouter };
