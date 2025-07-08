import { HTTP_STATUS } from '../constants';
import {
	db,
	createFunderCollaborativeMember,
	getLimitValues,
	loadFunderCollaborativeMemberBundle,
	loadFunderCollaborativeMember,
	removeFunderCollaborativeMember,
	loadFunder,
} from '../database';
import { isAuthContext, isShortCode } from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import type { Request, Response } from 'express';
import type { ShortCode } from '../types';

const assertFunderIsCollaborative = async (
	funderShortCode: ShortCode,
): Promise<void> => {
	const funder = await loadFunder(db, null, funderShortCode);
	if (!funder.isCollaborative) {
		throw new InputValidationError('Funder is not collaborative.', []);
	}
};

const getFunderCollaborativeMembers = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const funderBundle = await loadFunderCollaborativeMemberBundle(
		db,
		req,
		limit,
		offset,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(funderBundle);
};

const getFunderCollaborativeMember = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const {
		params: { funderCollaborativeShortCode, memberShortCode },
	} = req;
	if (!isShortCode(funderCollaborativeShortCode)) {
		throw new InputValidationError(
			'Invalid funder short code.',
			isShortCode.errors ?? [],
		);
	}
	if (!isShortCode(memberShortCode)) {
		throw new InputValidationError(
			'Invalid member short code.',
			isShortCode.errors ?? [],
		);
	}
	const funder = await loadFunderCollaborativeMember(
		db,
		req,
		funderCollaborativeShortCode,
		memberShortCode,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(funder);
};

const postFunderCollaborativeMember = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const {
		params: { funderCollaborativeShortCode, memberShortCode },
	} = req;

	if (!isShortCode(funderCollaborativeShortCode)) {
		throw new InputValidationError(
			'Invalid funder short code.',
			isShortCode.errors ?? [],
		);
	}
	if (!isShortCode(memberShortCode)) {
		throw new InputValidationError(
			'Invalid member short code.',
			isShortCode.errors ?? [],
		);
	}
	await assertFunderIsCollaborative(funderCollaborativeShortCode);

	const funder = await createFunderCollaborativeMember(db, req, {
		funderCollaborativeShortCode,
		memberShortCode,
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
	const {
		params: { funderCollaborativeShortCode, memberShortCode },
	} = req;
	if (!isShortCode(funderCollaborativeShortCode)) {
		throw new InputValidationError(
			'Invalid funder short code.',
			isShortCode.errors ?? [],
		);
	}
	if (!isShortCode(memberShortCode)) {
		throw new InputValidationError(
			'Invalid member short code.',
			isShortCode.errors ?? [],
		);
	}

	const item = await removeFunderCollaborativeMember(
		db,
		null,
		funderCollaborativeShortCode,
		memberShortCode,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(item);
};

export const funderCollaborativeMembersHandlers = {
	getFunderCollaborativeMembers,
	getFunderCollaborativeMember,
	postFunderCollaborativeMember,
	deleteFunderCollaborativeMember,
};
