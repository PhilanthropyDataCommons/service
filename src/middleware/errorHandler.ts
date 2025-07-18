import { UnauthorizedError as JwtUnauthorizedError } from 'express-jwt';
import { HTTP_STATUS } from '../constants';
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
			return HTTP_STATUS.CLIENT_ERROR.UNPROCESSABLE_CONTENT;
		case PostgresErrorCode.UNIQUE_VIOLATION.valueOf():
			return HTTP_STATUS.CLIENT_ERROR.CONFLICT;
		case PostgresErrorCode.NUMBER_OUT_OF_RANGE.valueOf():
			return HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST;
		case PostgresErrorCode.CHECK_CONSTRAINT_VIOLATION.valueOf():
			return HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST;
		case PostgresErrorCode.INSUFFICIENT_RESOURCES.valueOf():
			return HTTP_STATUS.SERVER_ERROR.SERVICE_UNAVAILABLE;
		default:
			return HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR;
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

const getHttpStatusCodeFromDatabaseError = (error: DatabaseError): number => {
	const {
		tinyPgError: {
			queryContext: {
				error: { code },
			},
		},
	} = error;
	return getHttpStatusCodeForDatabaseErrorCode(code);
};

const isJwksRsaRateLimitError = (error: unknown): boolean =>
	typeof error === 'string' &&
	error.includes('exceeds maximum tokens per interval');

const getHttpStatusCodeForError = (error: unknown): number => {
	if (error instanceof DatabaseError) {
		return getHttpStatusCodeFromDatabaseError(error);
	}

	if (isJwksRsaRateLimitError(error)) {
		return HTTP_STATUS.SERVER_ERROR.SERVICE_UNAVAILABLE;
	}

	if (error instanceof Error) {
		switch (error.constructor) {
			case InternalValidationError:
				return HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR;
			case InputValidationError:
				return HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST;
			case InputConflictError:
				return HTTP_STATUS.CLIENT_ERROR.CONFLICT;
			case UnauthorizedError:
			case JwtUnauthorizedError:
				return HTTP_STATUS.CLIENT_ERROR.UNAUTHORIZED;
			case NotFoundError:
				return HTTP_STATUS.CLIENT_ERROR.NOT_FOUND;
			case UnprocessableEntityError:
				return HTTP_STATUS.CLIENT_ERROR.UNPROCESSABLE_CONTENT;
			default:
				return HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR;
		}
	}

	return HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR;
};

const getMessageForError = (error: unknown): string => {
	if (error instanceof DatabaseError) {
		const {
			tinyPgError: {
				queryContext: {
					error: { code: errorCode },
				},
			},
		} = error;
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

export const errorHandler = (
	err: unknown,
	req: Request,
	res: Response,
	/* eslint-disable-next-line @typescript-eslint/no-unused-vars --
	 * Express requires us to have four parameters or else it doesn't know this is
	 * intended to be an error handler; this is why we must include `next` even though
	 * it isn't actually used.
	 */
	next: NextFunction,
): void => {
	logger.trace(req.body);
	const wrappedError = isTinyPgErrorWithQueryContext(err)
		? new DatabaseError('Error with a database operation.', err)
		: err;
	const statusCode = getHttpStatusCodeForError(wrappedError);
	if (Object.values(HTTP_STATUS.SERVER_ERROR).includes(statusCode)) {
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
