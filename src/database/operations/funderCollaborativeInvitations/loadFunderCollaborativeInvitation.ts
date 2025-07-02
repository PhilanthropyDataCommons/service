import { generateLoadItemOperation } from '../generators';
import type { ShortCode, FunderCollaborativeInvitation } from '../../../types';

const loadFunderCollaborativeInvitation = generateLoadItemOperation<
	FunderCollaborativeInvitation,
	[funderShortCode: ShortCode, invitationShortCode: ShortCode]
>(
	'funderCollaborativeInvitations.selectByShortCode',
	'FunderCollaborativeInvitation',
	['funderShortCode', 'invitationShortCode'],
);

export { loadFunderCollaborativeInvitation };
