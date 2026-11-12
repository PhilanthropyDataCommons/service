import { generateLoadBundleOperation } from '../generators';
import type {
	Id,
	KeycloakId,
	PermissionGrant,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantSortField,
	PermissionGrantVerb,
	ShortCode,
	SortDirection,
} from '../../../types';

const loadPermissionGrantBundle = generateLoadBundleOperation<
	PermissionGrant,
	[
		changemakerId: Id | undefined,
		funderShortCode: ShortCode | undefined,
		dataProviderShortCode: ShortCode | undefined,
		proposalId: Id | undefined,
		granteeType: PermissionGrantGranteeType | undefined,
		verb: PermissionGrantVerb | undefined,
		contextEntityType: PermissionGrantEntityType | undefined,
		scope: PermissionGrantEntityType | undefined,
		createdBy: KeycloakId | undefined,
		granteeUserKeycloakUserId: KeycloakId | undefined,
		granteeKeycloakOrganizationId: KeycloakId | undefined,
		sortField: PermissionGrantSortField | undefined,
		sortDirection: SortDirection | undefined,
	]
>('permissionGrants.selectWithPagination', [
	'changemakerId',
	'funderShortCode',
	'dataProviderShortCode',
	'proposalId',
	'granteeType',
	'verb',
	'contextEntityType',
	'scope',
	'createdBy',
	'granteeUserKeycloakUserId',
	'granteeKeycloakOrganizationId',
	'sortField',
	'sortDirection',
]);

export { loadPermissionGrantBundle };
