import { generateHasPermissionOperation } from '../generators';

const hasOpportunityPermission = generateHasPermissionOperation(
	'authorization.hasOpportunityPermission',
	'opportunityId',
);

export { hasOpportunityPermission };
