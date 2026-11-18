import {
	getDatabase,
	createOrUpdateUser,
	loadUserByKeycloakUserId,
	createEphemeralUserGroupAssociation,
} from '../database';
import {
	EMPTY_AUTH_CONTEXT_ROLES,
	getAuthSubFromRequest,
	getKeycloakOrganizationIdsFromRequest,
	getJwtExpFromRequest,
	getJwtIatFromRequest,
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

const EPHEMERAL_USER_GROUP_ASSOCIATION_LIFETIME_SECONDS = 180;

const getEphemeralUserGroupAssociationExpiration = (): string =>
	new Date(
		Date.now() +
			EPHEMERAL_USER_GROUP_ASSOCIATION_LIFETIME_SECONDS * MS_PER_SECOND,
	).toISOString();

const recordAuthenticatedUser = async (
	req: Request,
	keycloakUserId: KeycloakId,
): Promise<void> => {
	const db = getDatabase();
	const jwtIssuedAt = getJwtIatFromRequest(req);
	await createOrUpdateUser(
		db,
		null,
		{
			keycloakUserId,
			keycloakUserName: getAuthNameFromRequest(req),
		},
		jwtIssuedAt === null ? null : epochSecondsToIsoString(jwtIssuedAt),
	);
	const keycloakOrganizationIds = getKeycloakOrganizationIdsFromRequest(req);
	await allNoLeaks(
		keycloakOrganizationIds.map(
			async (keycloakOrganizationId) =>
				await createEphemeralUserGroupAssociation(db, null, {
					userKeycloakUserId: keycloakUserId,
					userGroupKeycloakOrganizationId: keycloakOrganizationId,
					notAfter: getEphemeralUserGroupAssociationExpiration(),
				}),
		),
	);
	const user = await loadUserByKeycloakUserId(
		db,
		{
			user: { keycloakUserId },
			role: EMPTY_AUTH_CONTEXT_ROLES,
		},
		keycloakUserId,
	);
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

	recordAuthenticatedUser(req, stringToKeycloakId(keycloakUserId))
		.then(() => {
			next();
		})
		.catch((err: unknown) => {
			next(err);
		});
};

export { addUserContext };
