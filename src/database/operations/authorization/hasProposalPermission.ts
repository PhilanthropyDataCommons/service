import { generateHasPermissionOperation } from '../generators';

const hasProposalPermission = generateHasPermissionOperation(
	'authorization.hasProposalPermission',
	'proposalId',
);

export { hasProposalPermission };
