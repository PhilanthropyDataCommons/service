import { generateLoadBundleOperation } from '../generators';
import type { FunderCollaborativeInvitation, ShortCode } from '../../../types';

const loadRecievedFunderCollaborativeInvitiationBundle =
	generateLoadBundleOperation<
		FunderCollaborativeInvitation,
		[invitationShortCode: ShortCode]
	>(
		'funderCollaborativeInvitations.selectByInvitationShortCode',
		'funder_collaborative_invitations',
		['invitationShortCode'],
	);

export { loadRecievedFunderCollaborativeInvitiationBundle };
