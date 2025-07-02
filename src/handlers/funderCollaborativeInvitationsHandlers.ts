import { HTTP_STATUS } from '../constants';
import {
	db,
	getLimitValues,
	loadFunderCollaborativeInvitiationBundle,
	createFunderCollaborativeInvitation,
	createOrUpdateFunderCollaborativeMember,
	updateFunderCollaborativeInvitation,
} from '../database';
import {
	FunderCollaborativeInvitationStatus,
	isAuthContext,
	isFunderCollaborativeInvitationPatch,
	isFunderCollaborativeInvitationPost,
} from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { isShortCode } from '../types/ShortCode';
import type { Request, Response } from 'express';

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
		await createFunderCollaborativeInvitation(db, req, {
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
	const finalFunderCollaborativeInvitation = await db.transaction(
		async (transactionDb) => {
			const funderCollaborativeInvitation =
				await updateFunderCollaborativeInvitation(
					transactionDb,
					req,
					{
						invitationStatus,
					},
					invitedFunderShortCode,
					funderShortCode,
				);
			if (invitationStatus === FunderCollaborativeInvitationStatus.ACCEPTED) {
				await createOrUpdateFunderCollaborativeMember(transactionDb, req, {
					funderCollaborativeShortCode: invitedFunderShortCode,
					memberFunderShortCode: funderShortCode,
				});
			}
			return {
				...funderCollaborativeInvitation,
			};
		},
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(finalFunderCollaborativeInvitation);
};

export const funderCollaborativeInvitationsHandlers = {
	postFunderCollaborativeInvitation,
	getSentFunderCollaborativeInvitations,
	getRecievedFunderCollaborativeInvitations,
	patchFunderCollaborativeInvitation,
};
