import {
	db,
	createOrUpdateUser,
	loadUserByKeycloakUserId,
	createEphemeralUserGroupAssociation,
} from '../database';
import {
	getAuthSubFromRequest,
	getKeycloakOrganizationIdsFromRequest,
	getJwtExpFromRequest,
	isKeycloakId,
	keycloakIdToString,
	stringToKeycloakId,
} from '../types';
import { getSystemUser } from '../config';
import { InputValidationError } from '../errors';
import { MS_PER_SECOND } from '../constants';
import type { Request, NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';

const MINIMUM_EPHEMERAL_USER_GROUP_ASSOCIATION_TIMEOUT_SECONDS = 180;
const JWT_NEVER_EXPIRES = 0;

const addUserContext = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const keycloakUserId = getAuthSubFromRequest(req);
	const keycloakOrganizationIds = getKeycloakOrganizationIdsFromRequest(req);
	const jwtExpiration = getJwtExpFromRequest(req) ?? JWT_NEVER_EXPIRES;
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

	createOrUpdateUser(db, null, {
		keycloakUserId: stringToKeycloakId(keycloakUserId),
	})
		.then(() => {
			const createEphemeralUserGroupAssociationPromises =
				keycloakOrganizationIds.map(
					async (keycloakOrganizationId) =>
						await createEphemeralUserGroupAssociation(db, null, {
							userKeycloakUserId: keycloakUserId,
							userGroupKeycloakOrganizationId: keycloakOrganizationId,
							notAfter: new Date(
								Math.max(
									jwtExpiration,
									MINIMUM_EPHEMERAL_USER_GROUP_ASSOCIATION_TIMEOUT_SECONDS,
								) * MS_PER_SECOND,
							).toISOString(),
						}),
				);
			Promise.all(createEphemeralUserGroupAssociationPromises)
				.then(() => {
					loadUserByKeycloakUserId(db, null, keycloakUserId)
						.then((user) => {
							(req as AuthenticatedRequest).user = user;
							next();
						})
						.catch((err) => {
							next(err);
						});
				})
				.catch((err) => {
					next(err);
				});
		})
		.catch((err) => {
			next(err);
		});
};

export { addUserContext };
