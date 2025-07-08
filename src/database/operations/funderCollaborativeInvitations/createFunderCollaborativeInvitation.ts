import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	FunderCollaborativeInvitation,
	InternallyWritableFunderCollaborativeInvitation,
} from '../../../types';

const createFunderCollaborativeInvitation = generateCreateOrUpdateItemOperation<
	FunderCollaborativeInvitation,
	InternallyWritableFunderCollaborativeInvitation,
	[]
>(
	'funderCollaborativeInvitations.insertOne',
	['funderShortCode', 'invitationShortCode', 'invitationStatus'],
	[],
);

export { createFunderCollaborativeInvitation };
