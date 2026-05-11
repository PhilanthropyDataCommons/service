interface JsonResultSet<T> {
	object: T;
}

interface PaginatedJsonResultSet<T> {
	object: T | null;
	total: string;
}

interface UpsertJsonResultSet<T> {
	object: T;
	wasInserted: boolean;
}

export {
	type JsonResultSet,
	type PaginatedJsonResultSet,
	type UpsertJsonResultSet,
};
