import { HTTP_STATUS } from '../constants';
import {
	db,
	getLimitValues,
	loadFunderCollaborativeMember,
	loadFunderCollaborativeMemberBundle,
	createOrUpdateFunderCollaborativeMember,
	removeFunderCollaborativeMember,
} from '../database';
import { isAuthContext } from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { isShortCode } from '../types/ShortCode';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';

const getFunderCollaborativeMember = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const { funderShortCode, memberFunderShortCode } = coerceParams(req.params);
	if (!isShortCode(funderShortCode)) {
		throw new InputValidationError(
			'Invalid funder short code.',
			isShortCode.errors ?? [],
		);
	}
	if (!isShortCode(memberFunderShortCode)) {
		throw new InputValidationError(
			'Invalid member short code.',
			isShortCode.errors ?? [],
		);
	}
	const funder = await loadFunderCollaborativeMember(
		db,
		req,
		funderShortCode,
		memberFunderShortCode,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(funder);
};

const getFunderCollaborativeMembers = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const { funderShortCode } = coerceParams(req.params);
	if (!isShortCode(funderShortCode)) {
		throw new InputValidationError(
			'Invalid funder short code.',
			isShortCode.errors ?? [],
		);
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const funderBundle = await loadFunderCollaborativeMemberBundle(
		db,
		req,
		funderShortCode,
		undefined,
		limit,
		offset,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(funderBundle);
};

const postFunderCollaborativeMember = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const { funderShortCode, memberFunderShortCode } = coerceParams(req.params);

	if (!isShortCode(funderShortCode)) {
		throw new InputValidationError(
			'Invalid funder short code.',
			isShortCode.errors ?? [],
		);
	}
	if (!isShortCode(memberFunderShortCode)) {
		throw new InputValidationError(
			'Invalid member funder short code.',
			isShortCode.errors ?? [],
		);
	}

	const funder = await createOrUpdateFunderCollaborativeMember(db, req, {
		funderCollaborativeShortCode: funderShortCode,
		memberFunderShortCode,
	});
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(funder);
};

const deleteFunderCollaborativeMember = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const { funderShortCode, memberFunderShortCode } = coerceParams(req.params);
	if (!isShortCode(funderShortCode)) {
		throw new InputValidationError(
			'Invalid funder short code.',
			isShortCode.errors ?? [],
		);
	}
	if (!isShortCode(memberFunderShortCode)) {
		throw new InputValidationError(
			'Invalid member funder short code.',
			isShortCode.errors ?? [],
		);
	}

	const item = await removeFunderCollaborativeMember(
		db,
		null,
		funderShortCode,
		memberFunderShortCode,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(item);
};

export const funderCollaborativeMembersHandlers = {
	getFunderCollaborativeMember,
	getFunderCollaborativeMembers,
	postFunderCollaborativeMember,
	deleteFunderCollaborativeMember,
};
