interface OrganizationSyncSummary {
	organizations: {
		seen: number;
		added: number;
		updated: number;
		disabled: number;
	};
	memberships: {
		seen: number;
		added: number;
		updated: number;
		disabled: number;
	};
}

export { type OrganizationSyncSummary };
