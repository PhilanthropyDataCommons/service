import { generateUpsertItemOperation } from '../generators';
import type {
	FunderCollaborativeInvitation,
	InternallyWritableFunderCollaborativeInvitation,
} from '../../../types';

const createFunderCollaborativeInvitation = generateUpsertItemOperation<
	FunderCollaborativeInvitation,
	InternallyWritableFunderCollaborativeInvitation,
	[]
>(
	'funderCollaborativeInvitations.insertOne',
	[
		'funderCollaborativeShortCode',
		'invitedFunderShortCode',
		'invitationStatus',
	],
	[],
);

export { createFunderCollaborativeInvitation };
