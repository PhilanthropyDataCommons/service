import { TinyPgError } from 'tinypg';
import { PostgressErrorCode } from '../database/db';
import { isQueryContextWithError } from '../types';
import type { Response } from 'express';
import type { Logger } from 'pino';

export const handleDbPromiseFailure = (
  error: unknown,
  res: Response,
  logger: Logger,
): void => {
  if (error instanceof TinyPgError
  && isQueryContextWithError(error.queryContext)) {
    switch (error.queryContext.error.code) {
      case PostgressErrorCode.FOREIGN_KEY_VIOLATION:
        res.status(409)
          .contentType('application/json')
          .send({
            message: 'Unique key constraint violation.',
            errors: [error.queryContext.error],
          });
        return;
      case PostgressErrorCode.UNIQUE_VIOLATION:
        res.status(409)
          .contentType('application/json')
          .send({
            message: 'Unique key constraint violation.',
            errors: [error.queryContext.error],
          });
        return;
      default:
    }
  }
  logger.warn(error);
  res.status(500)
    .contentType('application/json')
    .send(error);
};
