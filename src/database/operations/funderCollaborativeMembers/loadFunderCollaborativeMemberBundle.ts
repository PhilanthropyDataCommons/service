import { generateLoadBundleOperation } from '../generators';
import type { FunderCollaborativeMember } from '../../../types';

const loadFunderCollaborativeMemberBundle = generateLoadBundleOperation<
	FunderCollaborativeMember,
	[]
>(
	'funderCollaborativeMembers.selectWithPagination',
	'funder_collaborative_members',
	[],
);

export { loadFunderCollaborativeMemberBundle };
