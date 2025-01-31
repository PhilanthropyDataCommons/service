import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	OrganizationFunderPermission,
	InternallyWritableOrganizationFunderPermission,
} from '../../../types';

const createOrUpdateOrganizationFunderPermission =
	generateCreateOrUpdateItemOperation<
		OrganizationFunderPermission,
		InternallyWritableOrganizationFunderPermission,
		[]
	>('organizationFunderPermissions.insertOrUpdateOne', [
		'keycloakOrganizationId',
		'permission',
		'funderShortCode',
		'createdBy',
	],[]);

export { createOrUpdateOrganizationFunderPermission };
