import { HTTP_STATUS } from '../constants';
import { db, loadOrganization } from '../database';
import { isAuthContext, isId, isKeycloakId } from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import type { Request, Response } from 'express';

const getOrganization = async (req: Request, res: Response): Promise<void> => {
	const {
		params: { keycloakOrganizationId },
	} = req;
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	if (!isKeycloakId(keycloakOrganizationId)) {
		throw new InputValidationError(
			'Invalid keycloakOrganizationId.',
			isId.errors ?? [],
		);
	}
	const organization = await loadOrganization(db, req, keycloakOrganizationId);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(organization);
};

export const organizationsHandlers = {
	getOrganization,
};
