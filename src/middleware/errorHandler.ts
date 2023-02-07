import {
  AuthenticationError,
  DatabaseError,
  InternalValidationError,
  InputValidationError,
  InputConflictError,
  NotFoundError,
} from '../errors';
import { PostgresErrorCode } from '../types';
import { getLogger } from '../logger';
import type {
  NextFunction,
  Request,
  Response,
} from 'express';

const logger = getLogger(__filename);

const getHttpStatusCodeForDatabaseErrorCode = (errorCode: string): number => {
  switch (errorCode) {
    case PostgresErrorCode.FOREIGN_KEY_VIOLATION:
      return 409;
    case PostgresErrorCode.UNIQUE_VIOLATION:
      return 409;
    case PostgresErrorCode.INSUFFICIENT_RESOURCES:
      return 503;
    default:
      return 500;
  }
};

const getMessageForDatabaseErrorCode = (errorCode: string): string => {
  switch (errorCode) {
    case PostgresErrorCode.FOREIGN_KEY_VIOLATION:
      return 'Foreign key constraint violation.';
    case PostgresErrorCode.UNIQUE_VIOLATION:
      return 'Unique key constraint violation.';
    case PostgresErrorCode.INSUFFICIENT_RESOURCES:
      return 'Insufficient resources.';
    default:
      return 'Unexpected database error.';
  }
};

const getNameForError = (error: unknown): string => {
  if (error instanceof Error
    && error.name !== 'Error') {
    return error.name;
  }
  return 'UnknownError';
};

const getHttpStatusCodeForError = (error: unknown): number => {
  if (error instanceof DatabaseError) {
    const errorCode = error.tinyPgError.queryContext.error.code;
    return getHttpStatusCodeForDatabaseErrorCode(errorCode);
  }
  if (error instanceof InternalValidationError) {
    return 500;
  }
  if (error instanceof InputValidationError) {
    return 400;
  }
  if (error instanceof InputConflictError) {
    return 409;
  }
  if (error instanceof AuthenticationError) {
    return 401;
  }
  if (error instanceof NotFoundError) {
    return 404;
  }
  return 500;
};

const getMessageForError = (error: unknown): string => {
  if (error instanceof DatabaseError) {
    const errorCode = error.tinyPgError.queryContext.error.code;
    return getMessageForDatabaseErrorCode(errorCode);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error.';
};

const getDetailsForError = (error: unknown): unknown[] => {
  if (error instanceof DatabaseError) {
    return [error.tinyPgError.queryContext.error];
  }
  if (error instanceof InternalValidationError) {
    return error.errors;
  }
  if (error instanceof InputValidationError) {
    return error.errors;
  }
  if (error instanceof InputConflictError) {
    return [error.details];
  }
  return [error];
};

// Express requires us to have four parameters or else it doesn't know this is
// intended to be an error handler; this is why we must include `next` even though
// it isn't actually used.
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
): void => {
  logger.debug(err);
  logger.trace(req.body);
  const statusCode = getHttpStatusCodeForError(err);
  res.status(statusCode)
    .contentType('application/json')
    .send({
      name: getNameForError(err),
      message: getMessageForError(err),
      details: getDetailsForError(err),
    });
};
