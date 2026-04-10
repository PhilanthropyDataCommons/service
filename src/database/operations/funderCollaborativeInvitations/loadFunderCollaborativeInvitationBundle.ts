import { generateLoadBundleOperation } from '../generators';
import type {
	FunderCollaborativeInvitation,
	FunderCollaborativeInvitationStatus,
	ShortCode,
} from '../../../types';

const loadFunderCollaborativeInvitiationBundle = generateLoadBundleOperation<
	FunderCollaborativeInvitation,
	[
		funderCollaborativeShortCode: ShortCode | undefined,
		invitedFunderShortCode: ShortCode | undefined,
		status: FunderCollaborativeInvitationStatus | undefined,
	]
>('funderCollaborativeInvitations.selectWithPagination', [
	'funderCollaborativeShortCode',
	'invitedFunderShortCode',
	'status',
]);

export { loadFunderCollaborativeInvitiationBundle };
