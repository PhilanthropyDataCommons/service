import express from 'express';
import { defaultPermissionGrantsHandlers } from '../handlers/defaultPermissionGrantsHandlers';
import { requireAdministratorRole, requireAuthentication } from '../middleware';

const defaultPermissionGrantsRouter = express.Router();

defaultPermissionGrantsRouter.get(
	'/',
	requireAuthentication,
	requireAdministratorRole,
	defaultPermissionGrantsHandlers.getDefaultPermissionGrants,
);

defaultPermissionGrantsRouter.post(
	'/',
	requireAuthentication,
	requireAdministratorRole,
	defaultPermissionGrantsHandlers.postDefaultPermissionGrant,
);

defaultPermissionGrantsRouter.get(
	'/:defaultPermissionGrantId',
	requireAuthentication,
	requireAdministratorRole,
	defaultPermissionGrantsHandlers.getDefaultPermissionGrant,
);

defaultPermissionGrantsRouter.put(
	'/:defaultPermissionGrantId',
	requireAuthentication,
	requireAdministratorRole,
	defaultPermissionGrantsHandlers.putDefaultPermissionGrant,
);

defaultPermissionGrantsRouter.delete(
	'/:defaultPermissionGrantId',
	requireAuthentication,
	requireAdministratorRole,
	defaultPermissionGrantsHandlers.deleteDefaultPermissionGrant,
);

export { defaultPermissionGrantsRouter };
