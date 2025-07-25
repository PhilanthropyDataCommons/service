import { generateLoadItemOperation } from '../generators';
import type { ShortCode, FunderCollaborativeInvitation } from '../../../types';

const loadFunderCollaborativeInvitation = generateLoadItemOperation<
	FunderCollaborativeInvitation,
	[funderCollaborativeShortCode: ShortCode, invitedFunderShortCode: ShortCode]
>(
	'funderCollaborativeInvitations.selectByShortCode',
	'FunderCollaborativeInvitation',
	['funderCollaborativeShortCode', 'invitedFunderShortCode'],
);

export { loadFunderCollaborativeInvitation };
