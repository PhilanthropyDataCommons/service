import { generateHasPermissionOperation } from '../generators';

const hasProposalFieldValuePermission = generateHasPermissionOperation(
	'authorization.hasProposalFieldValuePermission',
	'proposalFieldValueId',
);

export { hasProposalFieldValuePermission };
