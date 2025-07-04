import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	FunderCollaborativeMember,
	InternallyWritableFunderCollaborativeMember,
} from '../../../types/FunderCollaborativeMember';

const createFunderCollaborativeMember = generateCreateOrUpdateItemOperation<
	FunderCollaborativeMember,
	InternallyWritableFunderCollaborativeMember,
	[]
>(
	'funderCollaborativeMembers.insertOne',
	['funderCollaborativeShortCode', 'memberShortCode'],
	[],
);

export { createFunderCollaborativeMember };
