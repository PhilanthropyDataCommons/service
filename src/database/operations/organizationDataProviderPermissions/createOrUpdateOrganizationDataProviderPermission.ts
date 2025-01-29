import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	OrganizationDataProviderPermission,
	InternallyWritableOrganizationDataProviderPermission,
} from '../../../types';

const createOrUpdateOrganizationDataProviderPermission =
	generateCreateOrUpdateItemOperation<
		OrganizationDataProviderPermission,
		InternallyWritableOrganizationDataProviderPermission,
		[]
	>('organizationDataProviderPermissions.insertOrUpdateOne', [
		'keycloakOrganizationId',
		'permission',
		'dataProviderShortCode',
		'createdBy',
	],[]);

export { createOrUpdateOrganizationDataProviderPermission };
