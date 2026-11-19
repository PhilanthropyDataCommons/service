import {
	getDatabase,
	createEphemeralUserGroupAssociation,
	createOrUpdateEphemeralAuthContext,
	createOrUpdateUser,
	loadUserByKeycloakUserId,
} from '../database';
import {
	EMPTY_AUTH_CONTEXT_ROLES,
	getAuthSubFromRequest,
	getKeycloakOrganizationIdsFromRequest,
	getJwtExpFromRequest,
	getJwtIatFromRequest,
	getJwtJtiFromRequest,
	isKeycloakId,
	keycloakIdToString,
	stringToKeycloakId,
	getAuthNameFromRequest,
} from '../types';
import { getSystemUser } from '../config';
import { InputValidationError, UnauthorizedError } from '../errors';
import { MS_PER_SECOND } from '../constants';
import { allNoLeaks } from '../promises';
import { epochSecondsToIsoString } from '../time';
import type { Request, NextFunction, Response } from 'express';
import type { AuthenticatedRequest, KeycloakId } from '../types';

const EPHEMERAL_RECORD_LIFETIME_SECONDS = 180;

const getEphemeralRecordExpiration = (): string =>
	new Date(
		Date.now() + EPHEMERAL_RECORD_LIFETIME_SECONDS * MS_PER_SECOND,
	).toISOString();

const recordAuthenticatedUser = async (
	req: Request,
	keycloakUserId: KeycloakId,
	tokenId: string,
): Promise<void> => {
	const jwtIssuedAt = getJwtIatFromRequest(req);
	const notAfter = getEphemeralRecordExpiration();
	const authContextId = tokenId;
	const user = await getDatabase().transaction(async (transactionDb) => {
		await createOrUpdateUser(
			transactionDb,
			null,
			{
				keycloakUserId,
				keycloakUserName: getAuthNameFromRequest(req),
			},
			jwtIssuedAt === null ? null : epochSecondsToIsoString(jwtIssuedAt),
		);
		await createOrUpdateEphemeralAuthContext(transactionDb, null, {
			tokenId,
			userKeycloakUserId: keycloakUserId,
			notAfter,
		});
		const keycloakOrganizationIds = getKeycloakOrganizationIdsFromRequest(req);
		await allNoLeaks(
			keycloakOrganizationIds.map(
				async (keycloakOrganizationId) =>
					await createEphemeralUserGroupAssociation(transactionDb, null, {
						userKeycloakUserId: keycloakUserId,
						userGroupKeycloakOrganizationId: keycloakOrganizationId,
						notAfter,
					}),
			),
		);
		return await loadUserByKeycloakUserId(
			transactionDb,
			{
				authContextId,
				user: { keycloakUserId },
				role: EMPTY_AUTH_CONTEXT_ROLES,
			},
			keycloakUserId,
		);
	});
	(req as AuthenticatedRequest).authContextId = authContextId;
	(req as AuthenticatedRequest).user = user;
};

const addUserContext = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const keycloakUserId = getAuthSubFromRequest(req);
	const systemUser = getSystemUser();
	if (
		keycloakUserId === undefined ||
		keycloakUserId === keycloakIdToString(systemUser.keycloakUserId)
	) {
		next();
		return;
	}

	if (!isKeycloakId(keycloakUserId)) {
		next(
			new InputValidationError(
				'auth subject must be a valid keycloak user id',
				isKeycloakId.errors ?? [],
			),
		);
		return;
	}

	if (getJwtExpFromRequest(req) === null) {
		next(new UnauthorizedError('auth token must include an exp claim'));
		return;
	}

	const tokenId = getJwtJtiFromRequest(req);
	if (tokenId === null) {
		next(new UnauthorizedError('auth token must include a jti claim'));
		return;
	}

	recordAuthenticatedUser(req, stringToKeycloakId(keycloakUserId), tokenId)
		.then(() => {
			next();
		})
		.catch((err: unknown) => {
			next(err);
		});
};

export { addUserContext };
