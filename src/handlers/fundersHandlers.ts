import { HTTP_STATUS } from '../constants';
import {
	db,
	createOrUpdateFunder,
	getLimitValues,
	loadFunderBundle,
	loadFunder,
	createFunderCollaborativeInvitation,
	loadRecievedFunderCollaborativeInvitiationBundle,
	loadSentFunderCollaborativeInvitiationBundle,
	updateFunderCollaborativeInvitation,
	createFunderCollaborativeMember,
	loadFunderCollaborativeInvitation,
} from '../database';
import {
	FunderCollaborativeInvitationStatus,
	isWritableFunderCollaborativeInvitation,
	isWritableFunderCollaborativeInvitationForPatch,
	isAuthContext,
	isWritableFunder,
	isShortCode,
	type ShortCode,
} from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import type { Request, Response } from 'express';

const assertFunderExists = async (
	funderShortCode: ShortCode,
): Promise<void> => {
	await loadFunder(db, null, funderShortCode);
};

const assertFunderCollaborativeInvitationExists = async (
	funderShortCode: ShortCode,
	invitationShortCode: ShortCode,
): Promise<void> => {
	await loadFunderCollaborativeInvitation(
		db,
		null,
		funderShortCode,
		invitationShortCode,
	);
};

const getFunders = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
		return;
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
	const funder = await createOrUpdateFunder(db, req, {
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

const postFunderCollaborativeInvitation = async (
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

	await assertFunderExists(funderShortCode);

	const body = req.body as unknown;
	if (!isWritableFunderCollaborativeInvitation(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableFunderCollaborativeInvitation.errors ?? [],
		);
	}
	const { invitationShortCode, invitationStatus } = body;
	if (!isShortCode(invitationShortCode)) {
		throw new InputValidationError(
			'Invalid invitation short code.',
			isShortCode.errors ?? [],
		);
	}
	await assertFunderExists(invitationShortCode);

	const funderCollaborativeInvitation =
		await createFunderCollaborativeInvitation(db, null, {
			funderShortCode,
			invitationShortCode,
			invitationStatus,
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
	await assertFunderExists(funderShortCode);
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const funderCollaborativeInvitations =
		await loadSentFunderCollaborativeInvitiationBundle(
			db,
			null,
			funderShortCode,
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

	await assertFunderExists(funderShortCode);

	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const funderCollaborativeInvitations =
		await loadRecievedFunderCollaborativeInvitiationBundle(
			db,
			null,
			funderShortCode,
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
		params: { funderShortCode, invitationShortCode },
	} = req;

	if (!isShortCode(funderShortCode)) {
		throw new InputValidationError(
			'Invalid funder short code.',
			isShortCode.errors ?? [],
		);
	}

	if (!isShortCode(invitationShortCode)) {
		throw new InputValidationError(
			'Invalid invitation short code.',
			isShortCode.errors ?? [],
		);
	}

	await assertFunderCollaborativeInvitationExists(
		invitationShortCode,
		funderShortCode,
	);

	const body = req.body as unknown;

	if (!isWritableFunderCollaborativeInvitationForPatch(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableFunderCollaborativeInvitationForPatch.errors ?? [],
		);
	}

	const { invitationStatus } = body;

	const funderCollaborativeInvitation =
		await updateFunderCollaborativeInvitation(db, req, {
			funderShortCode: invitationShortCode,
			invitationShortCode: funderShortCode,
			invitationStatus,
		});
	if (invitationStatus === FunderCollaborativeInvitationStatus.ACCEPTED) {
		await createFunderCollaborativeMember(db, req, {
			funderCollaborativeShortCode: invitationShortCode,
			memberShortCode: funderShortCode,
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
	postFunderCollaborativeInvitation,
	getSentFunderCollaborativeInvitations,
	getRecievedFunderCollaborativeInvitations,
	patchFunderCollaborativeInvitation,
};
