import { v4 as uuidv4 } from 'uuid';
import { createProposal } from '../../database';
import { createTestOpportunity } from './createTestOpportunity';
import type { TinyPg } from 'tinypg';
import type {
	AuthContext,
	Opportunity,
	Proposal,
	WritableProposal,
} from '../../types';

let defaultOpportunityPromise: Promise<Opportunity> | null = null;

const getOrCreateDefaultOpportunity = async (
	db: TinyPg,
	authContext: AuthContext | null,
): Promise<Opportunity> => {
	defaultOpportunityPromise ??= createTestOpportunity(db, authContext);
	return await defaultOpportunityPromise;
};

const resetTestProposalFactory = (): void => {
	defaultOpportunityPromise = null;
};

const createTestProposal = async (
	db: TinyPg,
	authContext: AuthContext | null,
	overrideValues?: Partial<WritableProposal>,
): Promise<Proposal> => {
	const opportunityId =
		overrideValues?.opportunityId ??
		(await getOrCreateDefaultOpportunity(db, authContext)).id;
	const defaultValues: WritableProposal = {
		opportunityId,
		externalId: `test_proposal_${uuidv4()}`,
	};
	return await createProposal(db, authContext, {
		...defaultValues,
		...overrideValues,
	});
};

export { createTestProposal, resetTestProposalFactory };
