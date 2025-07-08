import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	FunderCollaborativeInvitation,
	InternallyWritableFunderCollaborativeInvitation,
} from '../../../types';

const updateFunderCollaborativeInvitation = generateCreateOrUpdateItemOperation<
	FunderCollaborativeInvitation,
	InternallyWritableFunderCollaborativeInvitation,
	[]
>(
	'funderCollaborativeInvitations.updateByShortCode',
	['funderShortCode', 'invitationShortCode', 'invitationStatus'],
	[],
);

export { updateFunderCollaborativeInvitation };
