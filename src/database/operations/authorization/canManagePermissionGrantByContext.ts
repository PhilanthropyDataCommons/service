import { generateExistsOperation } from '../generators';
import type { PermissionGrantContextEntity } from '../../../types';

const canManagePermissionGrantByContext =
	generateExistsOperation<PermissionGrantContextEntity>(
		'authorization.canManagePermissionGrantByContext',
		[
			'contextEntityType',
			'funderShortCode',
			'changemakerId',
			'dataProviderShortCode',
			'opportunityId',
			'proposalId',
			'proposalVersionId',
			'applicationFormId',
			'applicationFormFieldId',
			'proposalFieldValueId',
			'sourceId',
			'bulkUploadTaskId',
			'changemakerFieldValueId',
		],
	);

export { canManagePermissionGrantByContext };
