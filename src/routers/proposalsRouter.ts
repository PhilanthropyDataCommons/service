import express from 'express';
import { proposalsHandlers } from '../handlers/proposalsHandlers';

const proposalsRouter = express.Router();

proposalsRouter.get('/', proposalsHandlers.getProposals);

export { proposalsRouter };
