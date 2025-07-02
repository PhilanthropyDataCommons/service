import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	FunderCollaborativeInvitation,
	InternallyWritableFunderCollaborativeInvitation,
} from '../../../types';

const createOrUpdateFunderCollaborativeInvitation =
	generateCreateOrUpdateItemOperation<
		FunderCollaborativeInvitation,
		InternallyWritableFunderCollaborativeInvitation,
		[]
	>(
		'funderCollaborativeInvitations.insertOrUpdateOne',
		[
			'funderCollaborativeShortCode',
			'invitedFunderShortCode',
			'invitationStatus',
		],
		[],
	);

export { createOrUpdateFunderCollaborativeInvitation };
