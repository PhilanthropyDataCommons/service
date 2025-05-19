import { HTTP_STATUS } from '../constants';
import {
	db,
	createOrUpdateFunder,
	getLimitValues,
	loadFunderBundle,
	loadFunder,
	loadFunderCollaborativeMember,
	loadFunderCollaborativeMemberBundle,
	createOrUpdateFunderCollaborativeMember,
	removeFunderCollaborativeMember,
} from '../database';
import { isAuthContext, isWritableFunder } from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { isShortCode } from '../types/ShortCode';
import type { Request, Response } from 'express';

const getFunders = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const funderBundle = await loadFunderBundle(db, req, limit, offset);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(funderBundle);
};

const getFunder = async (req: Request, res: Response): Promise<void> => {
	const {
		params: { funderShortCode },
	} = req;
	if (!isShortCode(funderShortCode)) {
		throw new InputValidationError(
			'Invalid short code.',
			isShortCode.errors ?? [],
		);
	}
	const funder = await loadFunder(db, null, funderShortCode);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(funder);
};

const putFunder = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const {
		params: { funderShortCode: shortCode },
	} = req;
	if (!isShortCode(shortCode)) {
		throw new InputValidationError(
			'Invalid short code.',
			isShortCode.errors ?? [],
		);
	}

	const body = req.body as unknown;
	if (!isWritableFunder(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableFunder.errors ?? [],
		);
	}

	const { name, keycloakOrganizationId, isCollaborative } = body;
	const funder = await createOrUpdateFunder(db, null, {
		shortCode,
		name,
		keycloakOrganizationId,
		isCollaborative,
	});
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(funder);
};

const getFunderCollaborativeMember = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const {
		params: { funderShortCode, memberFunderShortCode },
	} = req;
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
	const {
		params: { funderShortCode },
	} = req;
	if (!isShortCode(funderShortCode)) {
		throw new InputValidationError(
			'Invalid funder collaborative short code.',
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
	const {
		params: { funderShortCode, memberFunderShortCode },
	} = req;

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
	const {
		params: { funderShortCode, memberFunderShortCode },
	} = req;
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

export const fundersHandlers = {
	getFunders,
	getFunder,
	putFunder,
	getFunderCollaborativeMember,
	getFunderCollaborativeMembers,
	postFunderCollaborativeMember,
	deleteFunderCollaborativeMember,
};
