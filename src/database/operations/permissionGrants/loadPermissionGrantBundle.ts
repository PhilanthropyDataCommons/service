import { generateLoadBundleOperation } from '../generators';
import type {
	Id,
	PermissionGrant,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
	ShortCode,
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
	]
>('permissionGrants.selectWithPagination', [
	'changemakerId',
	'funderShortCode',
	'dataProviderShortCode',
	'proposalId',
	'granteeType',
	'verb',
]);

export { loadPermissionGrantBundle };
