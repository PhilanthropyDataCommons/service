import { generateLoadItemOperation } from '../generators';
import type { FunderCollaborativeMember } from '../../../types/FunderCollaborativeMember';
import type { ShortCode } from '../../../types/ShortCode';

const loadFunderCollaborativeMember = generateLoadItemOperation<
	FunderCollaborativeMember,
	[funderCollaborativeShortCode: ShortCode, memberFunderShortCode: ShortCode]
>('funderCollaborativeMembers.selectByShortCode', 'FunderCollaborativeMember', [
	'funderCollaborativeShortCode',
	'memberFunderShortCode',
]);

export { loadFunderCollaborativeMember };
