import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	FunderCollaborativeInvitation,
	ShortCode,
	WritableFunderCollaborativeInvitation,
} from '../../../types';

const updateFunderCollaborativeInvitation = generateCreateOrUpdateItemOperation<
	FunderCollaborativeInvitation,
	Partial<WritableFunderCollaborativeInvitation>,
	[funderCollaborativeShortCode: ShortCode, invitedFunderShortCode: ShortCode]
>(
	'funderCollaborativeInvitations.updateByShortCode',
	['invitationStatus'],
	['funderCollaborativeShortCode', 'invitedFunderShortCode'],
);

export { updateFunderCollaborativeInvitation };
