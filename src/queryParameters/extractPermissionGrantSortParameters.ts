import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { PermissionGrantSortField, SortDirection } from '../types';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';

const DESCENDING_SORT_PREFIX = '-';

interface PermissionGrantSortParameters {
	sortField: PermissionGrantSortField | undefined;
	sortDirection: SortDirection | undefined;
}

interface PermissionGrantSortParametersQuery {
	_sort: string | undefined;
}

const permissionGrantSortParametersQuerySchema: JSONSchemaType<PermissionGrantSortParametersQuery> =
	{
		type: 'object',
		properties: {
			_sort: {
				type: 'string',
				enum: Object.values(PermissionGrantSortField).flatMap((sortField) => [
					sortField,
					`${DESCENDING_SORT_PREFIX}${sortField}`,
				]),
				nullable: true,
			},
		},
		required: [],
	};

const isPermissionGrantSortParametersQuery = ajv.compile(
	permissionGrantSortParametersQuerySchema,
);

const isPermissionGrantSortField = (
	value: string,
): value is PermissionGrantSortField =>
	Object.values<string>(PermissionGrantSortField).includes(value);

const extractPermissionGrantSortParameters = ({
	query,
}: Pick<Request, 'query'>): PermissionGrantSortParameters => {
	if (!isPermissionGrantSortParametersQuery(query)) {
		throw new InputValidationError(
			'Invalid sort parameters.',
			isPermissionGrantSortParametersQuery.errors ?? [],
		);
	}
	const { _sort: sort } = query;
	if (sort === undefined) {
		return {
			sortField: undefined,
			sortDirection: undefined,
		};
	}
	const isDescending = sort.startsWith(DESCENDING_SORT_PREFIX);
	const sortField = isDescending
		? sort.slice(DESCENDING_SORT_PREFIX.length)
		: sort;
	if (!isPermissionGrantSortField(sortField)) {
		throw new InputValidationError('Invalid sort parameters.', []);
	}
	return {
		sortField,
		sortDirection: isDescending
			? SortDirection.DESCENDING
			: SortDirection.ASCENDING,
	};
};

export { extractPermissionGrantSortParameters };
