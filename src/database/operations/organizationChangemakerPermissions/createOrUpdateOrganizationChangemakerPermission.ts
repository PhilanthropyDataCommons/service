import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	InternallyWritableOrganizationChangemakerPermission,
	OrganizationChangemakerPermission,
} from '../../../types';

const createOrUpdateOrganizationChangemakerPermission =
	generateCreateOrUpdateItemOperation<
		OrganizationChangemakerPermission,
		InternallyWritableOrganizationChangemakerPermission,
		[]
	>('organizationChangemakerPermissions.insertOrUpdateOne', [
		'keycloakOrganizationId',
		'permission',
		'changemakerId',
		'createdBy',
	],[]);

export { createOrUpdateOrganizationChangemakerPermission };
