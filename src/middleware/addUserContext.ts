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
import { epochSecondsToIsoString } from '../time';
import type { Request, NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';

const EPHEMERAL_USER_GROUP_ASSOCIATION_LIFETIME_SECONDS = 180;

const getEphemeralUserGroupAssociationExpiration = (): string =>
	new Date(
		Date.now() +
			EPHEMERAL_USER_GROUP_ASSOCIATION_LIFETIME_SECONDS * MS_PER_SECOND,
	).toISOString();

const addUserContext = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const db = getDatabase();
	const keycloakUserId = getAuthSubFromRequest(req);
	const keycloakUserName = getAuthNameFromRequest(req);
	const keycloakOrganizationIds = getKeycloakOrganizationIdsFromRequest(req);
	const jwtExpiration = getJwtExpFromRequest(req);
	const jwtIssuedAt = getJwtIatFromRequest(req);
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

	if (jwtExpiration === null) {
		next(new UnauthorizedError('auth token must include an exp claim'));
		return;
	}

	createOrUpdateUser(
		db,
		null,
		{
			keycloakUserId: stringToKeycloakId(keycloakUserId),
			keycloakUserName,
		},
		jwtIssuedAt === null ? null : epochSecondsToIsoString(jwtIssuedAt),
	)
		.then(() => {
			const createEphemeralUserGroupAssociationPromises =
				keycloakOrganizationIds.map(
					async (keycloakOrganizationId) =>
						await createEphemeralUserGroupAssociation(db, null, {
							userKeycloakUserId: keycloakUserId,
							userGroupKeycloakOrganizationId: keycloakOrganizationId,
							notAfter: getEphemeralUserGroupAssociationExpiration(),
						}),
				);
			Promise.all(createEphemeralUserGroupAssociationPromises)
				.then(() => {
					loadUserByKeycloakUserId(
						db,
						{
							user: { keycloakUserId: stringToKeycloakId(keycloakUserId) },
							role: EMPTY_AUTH_CONTEXT_ROLES,
						},
						keycloakUserId,
					)
						.then((user) => {
							(req as AuthenticatedRequest).user = user;
							next();
						})
						.catch((err: unknown) => {
							next(err);
						});
				})
				.catch((err: unknown) => {
					next(err);
				});
		})
		.catch((err: unknown) => {
			next(err);
		});
};

export { addUserContext };
