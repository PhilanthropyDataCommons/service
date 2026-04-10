interface JsonResultSet<T> {
	object: T;
}

interface PaginatedJsonResultSet<T> {
	object: T | null;
	total: string;
}

export { type JsonResultSet, type PaginatedJsonResultSet };
