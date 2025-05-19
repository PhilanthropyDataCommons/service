import { generateLoadItemOperation } from '../generators';
import type { FunderCollaborativeMember } from '../../../types/FunderCollaborativeMember';
import type { ShortCode } from '../../../types/ShortCode';

const loadFunderCollaborativeMember = generateLoadItemOperation<
	FunderCollaborativeMember,
	[funderCollaborativeShortCode: ShortCode, memberShortCode: ShortCode]
>('funderCollaborativeMembers.selectByShortCode', 'FunderCollaborativeMember', [
	'funderCollaborativeShortCode',
	'memberShortCode',
]);

export { loadFunderCollaborativeMember };
