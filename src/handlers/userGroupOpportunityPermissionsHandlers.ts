import { HTTP_STATUS } from '../constants';
import {
	db,
	createOrUpdateUserGroupOpportunityPermission,
	removeUserGroupOpportunityPermission,
} from '../database';
import {
	isAuthContext,
	isId,
	isKeycloakId,
	isOpportunityPermission,
	isWritableUserGroupOpportunityPermission,
} from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import type { Request, Response } from 'express';

const deleteUserGroupOpportunityPermission = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const {
		params: { keycloakOrganizationId, opportunityId, opportunityPermission },
	} = req;
	if (!isKeycloakId(keycloakOrganizationId)) {
		throw new InputValidationError(
			'Invalid keycloakOrganizationId parameter.',
			isKeycloakId.errors ?? [],
		);
	}
	if (!isId(opportunityId)) {
		throw new InputValidationError(
			'Invalid opportunityId parameter.',
			isId.errors ?? [],
		);
	}
	if (!isOpportunityPermission(opportunityPermission)) {
		throw new InputValidationError(
			'Invalid opportunity permission parameter.',
			isOpportunityPermission.errors ?? [],
		);
	}

	await removeUserGroupOpportunityPermission(
		db,
		null,
		keycloakOrganizationId,
		opportunityId,
		opportunityPermission,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT)
		.contentType('application/json')
		.send();
};

const putUserGroupOpportunityPermission = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const {
		params: { keycloakOrganizationId, opportunityId, opportunityPermission },
	} = req;

	if (!isKeycloakId(keycloakOrganizationId)) {
		throw new InputValidationError(
			'Invalid keycloakOrganizationId parameter.',
			isKeycloakId.errors ?? [],
		);
	}
	if (!isId(opportunityId)) {
		throw new InputValidationError(
			'Invalid opportunityId parameter.',
			isId.errors ?? [],
		);
	}
	if (!isOpportunityPermission(opportunityPermission)) {
		throw new InputValidationError(
			'Invalid opportunityPermission parameter.',
			isOpportunityPermission.errors ?? [],
		);
	}
	if (!isWritableUserGroupOpportunityPermission(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableUserGroupOpportunityPermission.errors ?? [],
		);
	}

	const userGroupOpportunityPermission =
		await createOrUpdateUserGroupOpportunityPermission(db, req, {
			keycloakOrganizationId,
			opportunityId,
			opportunityPermission,
		});
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(userGroupOpportunityPermission);
};

const userGroupOpportunityPermissionsHandlers = {
	deleteUserGroupOpportunityPermission,
	putUserGroupOpportunityPermission,
};

export { userGroupOpportunityPermissionsHandlers };
