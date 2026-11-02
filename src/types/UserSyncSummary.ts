interface UserSyncSummary {
	users: {
		seen: number;
		added: number;
		updated: number;
		disabled: number;
	};
}

export { type UserSyncSummary };
