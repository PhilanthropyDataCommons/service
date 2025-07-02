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
	createOrUpdateFunderCollaborativeInvitation,
	loadFunderCollaborativeInvitiationBundle,
} from '../database';
import {
	FunderCollaborativeInvitationStatus,
	isAuthContext,
	isFunderCollaborativeInvitationPatch,
	isFunderCollaborativeInvitationPost,
	isWritableFunder,
} from '../types';
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

const postFunderCollaborativeInvitation = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const {
		params: { funderShortCode, invitedFunderShortCode },
	} = req;
	if (!isShortCode(funderShortCode)) {
		throw new InputValidationError(
			'Invalid funder short code.',
			isShortCode.errors ?? [],
		);
	}
	if (!isShortCode(invitedFunderShortCode)) {
		throw new InputValidationError(
			'Invalid invited funder short code.',
			isShortCode.errors ?? [],
		);
	}
	const body = req.body as unknown;
	if (!isFunderCollaborativeInvitationPost(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isFunderCollaborativeInvitationPost.errors ?? [],
		);
	}

	const funderCollaborativeInvitation =
		await createOrUpdateFunderCollaborativeInvitation(db, req, {
			funderCollaborativeShortCode: funderShortCode,
			invitedFunderShortCode,
			invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
		});
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(funderCollaborativeInvitation);
};

const getSentFunderCollaborativeInvitations = async (
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
			'Invalid inviter short code.',
			isShortCode.errors ?? [],
		);
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const funderCollaborativeInvitations =
		await loadFunderCollaborativeInvitiationBundle(
			db,
			req,
			funderShortCode,
			undefined,
			undefined,
			limit,
			offset,
		);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(funderCollaborativeInvitations);
};

const getRecievedFunderCollaborativeInvitations = async (
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
			'Invalid funder short code.',
			isShortCode.errors ?? [],
		);
	}

	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const funderCollaborativeInvitations =
		await loadFunderCollaborativeInvitiationBundle(
			db,
			req,
			undefined,
			funderShortCode,
			undefined,
			limit,
			offset,
		);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(funderCollaborativeInvitations);
};

const patchFunderCollaborativeInvitation = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const {
		params: { funderShortCode, invitedFunderShortCode },
	} = req;

	if (!isShortCode(funderShortCode)) {
		throw new InputValidationError(
			'Invalid funder short code.',
			isShortCode.errors ?? [],
		);
	}

	if (!isShortCode(invitedFunderShortCode)) {
		throw new InputValidationError(
			'Invalid invited funder short code.',
			isShortCode.errors ?? [],
		);
	}

	const body = req.body as unknown;

	if (!isFunderCollaborativeInvitationPatch(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isFunderCollaborativeInvitationPatch.errors ?? [],
		);
	}

	const { invitationStatus } = body;

	const funderCollaborativeInvitation =
		await createOrUpdateFunderCollaborativeInvitation(db, req, {
			funderCollaborativeShortCode: invitedFunderShortCode,
			invitedFunderShortCode: funderShortCode,
			invitationStatus,
		});
	if (invitationStatus === FunderCollaborativeInvitationStatus.ACCEPTED) {
		await createOrUpdateFunderCollaborativeMember(db, req, {
			funderCollaborativeShortCode: invitedFunderShortCode,
			memberFunderShortCode: funderShortCode,
		});
	}
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(funderCollaborativeInvitation);
};

export const fundersHandlers = {
	getFunders,
	getFunder,
	putFunder,
	getFunderCollaborativeMember,
	getFunderCollaborativeMembers,
	postFunderCollaborativeMember,
	deleteFunderCollaborativeMember,
	postFunderCollaborativeInvitation,
	getSentFunderCollaborativeInvitations,
	getRecievedFunderCollaborativeInvitations,
	patchFunderCollaborativeInvitation,
};
