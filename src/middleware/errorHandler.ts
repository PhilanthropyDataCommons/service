import { UnauthorizedError as JwtUnauthorizedError } from 'express-jwt';
import {
	DatabaseError,
	InternalValidationError,
	InputValidationError,
	InputConflictError,
	NotFoundError,
	UnauthorizedError,
} from '../errors';
import { PostgresErrorCode } from '../types';
import { getLogger } from '../logger';
import type { NextFunction, Request, Response } from 'express';

const logger = getLogger(__filename);

const getHttpStatusCodeForDatabaseErrorCode = (errorCode: string): number => {
	switch (errorCode) {
		case PostgresErrorCode.FOREIGN_KEY_VIOLATION.valueOf():
			return 422;
		case PostgresErrorCode.UNIQUE_VIOLATION.valueOf():
			return 409;
		case PostgresErrorCode.NUMBER_OUT_OF_RANGE.valueOf():
			return 400;
		case PostgresErrorCode.CHECK_CONSTRAINT_VIOLATION.valueOf():
			return 400;
		case PostgresErrorCode.INSUFFICIENT_RESOURCES.valueOf():
			return 503;
		default:
			return 500;
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
		return 500;
	}
	if (error instanceof InputValidationError) {
		return 400;
	}
	if (error instanceof InputConflictError) {
		return 409;
	}
	if (error instanceof UnauthorizedError) {
		return 401;
	}
	if (error instanceof JwtUnauthorizedError) {
		return 401;
	}
	if (error instanceof NotFoundError) {
		return 404;
	}
	// In the `jwks-rsa` library, when a rate limit is exceeded a string error gets thrown.
	if (
		typeof error === 'string' &&
		error.includes('exceeds maximum tokens per interval')
	) {
		return 503;
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
	logger.trace(req.body);
	const statusCode = getHttpStatusCodeForError(err);
	if (statusCode >= 500) {
		logger.error({ err, statusCode });
	} else {
		logger.debug({ err, statusCode });
	}
	res
		.status(statusCode)
		.contentType('application/json')
		.send({
			name: getNameForError(err),
			message: getMessageForError(err),
			details: getDetailsForError(err),
		});
};
