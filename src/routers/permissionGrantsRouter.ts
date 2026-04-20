import express from 'express';
import { permissionGrantsHandlers } from '../handlers/permissionGrantsHandlers';
import { requireAuthentication } from '../middleware';

const permissionGrantsRouter = express.Router();

permissionGrantsRouter.get(
	'/',
	requireAuthentication,
	permissionGrantsHandlers.getPermissionGrants,
);

permissionGrantsRouter.post(
	'/',
	requireAuthentication,
	permissionGrantsHandlers.postPermissionGrant,
);

permissionGrantsRouter.get(
	'/:permissionGrantId',
	requireAuthentication,
	permissionGrantsHandlers.getPermissionGrant,
);

permissionGrantsRouter.put(
	'/:permissionGrantId',
	requireAuthentication,
	permissionGrantsHandlers.putPermissionGrant,
);

permissionGrantsRouter.delete(
	'/:permissionGrantId',
	requireAuthentication,
	permissionGrantsHandlers.deletePermissionGrant,
);

export { permissionGrantsRouter };
