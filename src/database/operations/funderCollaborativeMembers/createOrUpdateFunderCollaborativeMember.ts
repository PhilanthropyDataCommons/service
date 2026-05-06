import { generateUpsertItemOperation } from '../generators';
import type {
	FunderCollaborativeMember,
	InternallyWritableFunderCollaborativeMember,
} from '../../../types/FunderCollaborativeMember';

const createOrUpdateFunderCollaborativeMember = generateUpsertItemOperation<
	FunderCollaborativeMember,
	InternallyWritableFunderCollaborativeMember,
	[]
>(
	'funderCollaborativeMembers.insertOrUpdateOne',
	['funderCollaborativeShortCode', 'memberFunderShortCode'],
	[],
);

export { createOrUpdateFunderCollaborativeMember };
