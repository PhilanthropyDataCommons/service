import type { BaseField, Organization, ProposalFieldValue } from '.';

interface OrganizationDetails {
	readonly organization: Organization;
	// TODO: Make these a type that covers either ProposalFieldValue or ExternalFieldValue.
	// TODO: improve the types below for better JSONification, e.g. use base field ID as key.
	/** Represents the so-called "gold" data, the map of valid and best values. */
	readonly bestVisibleFieldValues: Map<BaseField, ProposalFieldValue>;
	/** Reports all possible values from proposal versions in the system from which best got drawn. */
	readonly allVisibleFieldValues: Map<BaseField, ProposalFieldValue[]>;
}

export { OrganizationDetails };
