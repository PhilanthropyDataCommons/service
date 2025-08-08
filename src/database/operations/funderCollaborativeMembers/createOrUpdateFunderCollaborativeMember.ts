import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	FunderCollaborativeMember,
	InternallyWritableFunderCollaborativeMember,
} from '../../../types/FunderCollaborativeMember';

const createOrUpdateFunderCollaborativeMember =
	generateCreateOrUpdateItemOperation<
		FunderCollaborativeMember,
		InternallyWritableFunderCollaborativeMember,
		[]
	>(
		'funderCollaborativeMembers.insertOrUpdateOne',
		['funderCollaborativeShortCode', 'memberFunderShortCode'],
		[],
	);

export { createOrUpdateFunderCollaborativeMember };
