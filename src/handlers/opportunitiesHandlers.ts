import { db } from '../database';
import { logger as root_logger } from '../logger';
import type {
  Request,
  Response,
} from 'express';
import type { Result } from 'tinypg';
import type { Opportunity } from '../types/opportunitiesTypes';

const logger = root_logger.child({ source: 'handlers/opportunitiesHandlers' });

async function getOpportunities(req: Request, res: Response): Promise<void> {
  const results: Result<Opportunity> = await db.sql<Opportunity>('selectAllOpportunities');
  logger.debug(results.rows);
  res.status(200)
    .contentType('application/json')
    .send(results.rows);
}

export const opportunitiesHandlers = {
  getOpportunities,
};
