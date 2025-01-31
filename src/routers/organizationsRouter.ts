import express from 'express';
import { organizationChangemakerPermissionsHandlers } from '../handlers/organizationChangemakerPermissionsHandlers';
import { organizationFunderPermissionsHandlers } from '../handlers/organizationFunderPermissionsHandlers';
import { organizationDataProviderPermissionsHandlers } from '../handlers/organizationDataProviderPermissionsHandlers';
import {
	requireOrganizationChangemakerPermission,
	requireOrganizationDataProviderPermission,
	requireOrganizationFunderPermission,
} from '../middleware';
import { Permission } from '../types';

const organizationsRouter = express.Router();

organizationsRouter.put(
	'/:keycloakOrganizationId/changemakers/:changemakerId/permissions/:permission',
	requireOrganizationChangemakerPermission(Permission.MANAGE),
	organizationChangemakerPermissionsHandlers.putOrganizationChangemakerPermission,
);
organizationsRouter.delete(
	'/:keycloakOrganizationId/changemakers/:changemakerId/permissions/:permission',
	requireOrganizationChangemakerPermission(Permission.MANAGE),
	organizationChangemakerPermissionsHandlers.deleteOrganizationChangemakerPermission,
);
organizationsRouter.put(
	'/:keycloakOrganizationId/dataProviders/:dataProviderShortCode/permissions/:permission',
	requireOrganizationDataProviderPermission(Permission.MANAGE),
	organizationDataProviderPermissionsHandlers.putOrganizationDataProviderPermission,
);
organizationsRouter.delete(
	'/:keycloakOrganizationId/dataProviders/:dataProviderShortCode/permissions/:permission',
	requireOrganizationDataProviderPermission(Permission.MANAGE),
	organizationDataProviderPermissionsHandlers.deleteOrganizationDataProviderPermission,
);
organizationsRouter.put(
	'/:keycloakOrganizationId/funders/:funderShortCode/permissions/:permission',
	requireOrganizationFunderPermission(Permission.MANAGE),
	organizationFunderPermissionsHandlers.putOrganizationFunderPermission,
);
organizationsRouter.delete(
	'/:keycloakOrganizationId/funders/:funderShortCode/permissions/:permission',
	requireOrganizationFunderPermission(Permission.MANAGE),
	organizationFunderPermissionsHandlers.deleteOrganizationFunderPermission,
);

export { organizationsRouter };
