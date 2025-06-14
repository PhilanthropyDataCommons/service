import { UnauthorizedError as JwtUnauthorizedError } from 'express-jwt';
import { StatusCodes } from 'http-status-codes';
import {
	DatabaseError,
	InternalValidationError,
	InputValidationError,
	InputConflictError,
	NotFoundError,
	UnauthorizedError,
	UnprocessableEntityError,
} from '../errors';
import { isTinyPgErrorWithQueryContext, PostgresErrorCode } from '../types';
import { getLogger } from '../logger';
import type { NextFunction, Request, Response } from 'express';

const logger = getLogger(__filename);

const getHttpStatusCodeForDatabaseErrorCode = (errorCode: string): number => {
	switch (errorCode) {
		case PostgresErrorCode.FOREIGN_KEY_VIOLATION.valueOf():
			return StatusCodes.UNPROCESSABLE_ENTITY;
		case PostgresErrorCode.UNIQUE_VIOLATION.valueOf():
			return StatusCodes.CONFLICT;
		case PostgresErrorCode.NUMBER_OUT_OF_RANGE.valueOf():
			return StatusCodes.BAD_REQUEST;
		case PostgresErrorCode.CHECK_CONSTRAINT_VIOLATION.valueOf():
			return StatusCodes.BAD_REQUEST;
		case PostgresErrorCode.INSUFFICIENT_RESOURCES.valueOf():
			return StatusCodes.SERVICE_UNAVAILABLE;
		default:
			return StatusCodes.INTERNAL_SERVER_ERROR;
	}
};

const getMessageForDatabaseErrorCode = (errorCode: string): string => {
	switch (errorCode) {
		case PostgresErrorCode.FOREIGN_KEY_VIOLATION.valueOf():
			return 'Foreign key constraint violation.';
		case PostgresErrorCode.UNIQUE_VIOLATION.valueOf():
			return 'Unique key constraint violation.';
		case PostgresErrorCode.NUMBER_OUT_OF_RANGE.valueOf():
			return 'One of the numeric arguments was out of range for its type.';
		case PostgresErrorCode.CHECK_CONSTRAINT_VIOLATION.valueOf():
			return 'A constraint was violated.';
		case PostgresErrorCode.INSUFFICIENT_RESOURCES.valueOf():
			return 'Insufficient resources.';
		default:
			return 'Unexpected database error.';
	}
};

const getNameForError = (error: unknown): string => {
	if (error instanceof Error && error.name !== 'Error') {
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
		return StatusCodes.INTERNAL_SERVER_ERROR;
	}
	if (error instanceof InputValidationError) {
		return StatusCodes.BAD_REQUEST;
	}
	if (error instanceof InputConflictError) {
		return StatusCodes.CONFLICT;
	}
	if (error instanceof UnauthorizedError) {
		return StatusCodes.UNAUTHORIZED;
	}
	if (error instanceof JwtUnauthorizedError) {
		return StatusCodes.UNAUTHORIZED;
	}
	if (error instanceof NotFoundError) {
		return StatusCodes.NOT_FOUND;
	}
	if (error instanceof UnprocessableEntityError) {
		return StatusCodes.UNPROCESSABLE_ENTITY;
	}
	// In the `jwks-rsa` library, when a rate limit is exceeded a string error gets thrown.
	if (
		typeof error === 'string' &&
		error.includes('exceeds maximum tokens per interval')
	) {
		return StatusCodes.SERVICE_UNAVAILABLE;
	}
	return StatusCodes.INTERNAL_SERVER_ERROR;
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
	logger.trace(req.body);
	const wrappedError = isTinyPgErrorWithQueryContext(err)
		? new DatabaseError('Error with a database operation.', err)
		: err;
	const statusCode = getHttpStatusCodeForError(wrappedError);
	if (statusCode >= StatusCodes.INTERNAL_SERVER_ERROR.valueOf()) {
		logger.error({ wrappedError, statusCode });
	} else {
		logger.debug({ wrappedError, statusCode });
	}
	res
		.status(statusCode)
		.contentType('application/json')
		.send({
			name: getNameForError(wrappedError),
			message: getMessageForError(wrappedError),
			details: getDetailsForError(wrappedError),
		});
};
