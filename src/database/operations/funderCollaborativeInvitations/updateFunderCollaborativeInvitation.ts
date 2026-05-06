import { generateUpdateItemOperation } from '../generators';
import type {
	FunderCollaborativeInvitation,
	ShortCode,
	WritableFunderCollaborativeInvitation,
} from '../../../types';

const updateFunderCollaborativeInvitation = generateUpdateItemOperation<
	FunderCollaborativeInvitation,
	Partial<WritableFunderCollaborativeInvitation>,
	[funderCollaborativeShortCode: ShortCode, invitedFunderShortCode: ShortCode]
>(
	'funderCollaborativeInvitations.updateByShortCode',
	['invitationStatus'],
	['funderCollaborativeShortCode', 'invitedFunderShortCode'],
);

export { updateFunderCollaborativeInvitation };
