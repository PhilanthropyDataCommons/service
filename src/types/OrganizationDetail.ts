import type { Organization, ProposalFieldValue } from '.';

interface OrganizationDetail {
	readonly organization: Organization;
	// TODO: Make these a type that covers either ProposalFieldValue or ExternalFieldValue.
	// TODO: Get the associated base fields or make loadProposalFieldValuesByBaseFieldId include it.
	/** Represents the so-called "gold" data, the set of valid and best values. */
	readonly bestAvailableFieldValues: ProposalFieldValue[];
	/** Reports all possible values from proposal versions in the system from which best got drawn. */
	readonly allFieldValues: ProposalFieldValue[];
}

export { OrganizationDetail };
