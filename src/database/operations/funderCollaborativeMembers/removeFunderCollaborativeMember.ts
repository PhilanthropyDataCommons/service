import { generateRemoveItemOperation } from '../generators';
import type { FunderCollaborativeMember, ShortCode } from '../../../types';

const removeFunderCollaborativeMember = generateRemoveItemOperation<
	FunderCollaborativeMember,
	[funderCollaborativeShortCode: ShortCode, memberShortCode: ShortCode]
>('funderCollaborativeMembers.deleteOne', 'FunderCollaborativeMember', [
	'funderCollaborativeShortCode',
	'memberShortCode',
]);

export { removeFunderCollaborativeMember };
