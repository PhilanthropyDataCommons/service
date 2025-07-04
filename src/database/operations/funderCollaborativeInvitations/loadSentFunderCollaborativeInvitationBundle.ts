import { generateLoadBundleOperation } from '../generators';
import type { FunderCollaborativeInvitation, ShortCode } from '../../../types';

const loadSentFunderCollaborativeInvitiationBundle =
	generateLoadBundleOperation<
		FunderCollaborativeInvitation,
		[funderShortCode: ShortCode]
	>(
		'funderCollaborativeInvitations.selectByFunderShortCode',
		'funder_collaborative_invitations',
		['funderShortCode'],
	);

export { loadSentFunderCollaborativeInvitiationBundle };
