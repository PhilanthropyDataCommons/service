import { generateLoadBundleOperation } from '../generators';
import type { FunderCollaborativeMember, ShortCode } from '../../../types';

const loadFunderCollaborativeMemberBundle = generateLoadBundleOperation<
	FunderCollaborativeMember,
	[
		funderCollaborativeShortCode: ShortCode | undefined,
		memberFunderShortCode: ShortCode | undefined,
	]
>('funderCollaborativeMembers.selectWithPagination', [
	'funderCollaborativeShortCode',
	'memberFunderShortCode',
]);

export { loadFunderCollaborativeMemberBundle };
