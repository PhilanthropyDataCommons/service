import { generateRemoveItemOperation } from '../generators';
import type { FunderCollaborativeMember, ShortCode } from '../../../types';

const removeFunderCollaborativeMember = generateRemoveItemOperation<
	FunderCollaborativeMember,
	[funderCollaborativeShortCode: ShortCode, memberFunderShortCode: ShortCode]
>('funderCollaborativeMembers.deleteOne', 'FunderCollaborativeMember', [
	'funderCollaborativeShortCode',
	'memberFunderShortCode',
]);

export { removeFunderCollaborativeMember };
