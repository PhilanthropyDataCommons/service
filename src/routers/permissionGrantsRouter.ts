import express from 'express';
import { permissionGrantsHandlers } from '../handlers/permissionGrantsHandlers';
import { requireAdministratorRole, requireAuthentication } from '../middleware';

const permissionGrantsRouter = express.Router();

permissionGrantsRouter.get(
	'/',
	requireAuthentication,
	requireAdministratorRole,
	permissionGrantsHandlers.getPermissionGrants,
);

permissionGrantsRouter.post(
	'/',
	requireAuthentication,
	requireAdministratorRole,
	permissionGrantsHandlers.postPermissionGrant,
);

permissionGrantsRouter.get(
	'/:permissionGrantId',
	requireAuthentication,
	requireAdministratorRole,
	permissionGrantsHandlers.getPermissionGrant,
);

permissionGrantsRouter.delete(
	'/:permissionGrantId',
	requireAuthentication,
	requireAdministratorRole,
	permissionGrantsHandlers.deletePermissionGrant,
);

export { permissionGrantsRouter };
