import { generateHasPermissionOperation } from '../generators';

const hasProposalVersionPermission = generateHasPermissionOperation(
	'authorization.hasProposalVersionPermission',
	'proposalVersionId',
);

export { hasProposalVersionPermission };
