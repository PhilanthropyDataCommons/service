import { generateRemoveItemOperation } from '../generators';
import type { FunderCollaborativeInvitation, ShortCode } from '../../../types';

const removeFunderCollaborativeInvitation = generateRemoveItemOperation<
	FunderCollaborativeInvitation,
	[funderCollaborativeShortCode: ShortCode, invitedFunderShortCode: ShortCode]
>('funderCollaborativeInvitations.deleteOne', 'FunderCollaborativeInvitation', [
	'funderCollaborativeShortCode',
	'invitedFunderShortCode',
]);

export { removeFunderCollaborativeInvitation };
