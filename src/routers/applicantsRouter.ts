import express from 'express';
import { applicantsHandlers } from '../handlers/applicantsHandlers';

const applicantsRouter = express.Router();

applicantsRouter.get('/', applicantsHandlers.getApplicants);

export { applicantsRouter };
