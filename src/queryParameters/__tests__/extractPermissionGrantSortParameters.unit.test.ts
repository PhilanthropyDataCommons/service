import { extractPermissionGrantSortParameters } from '..';
import { InputValidationError } from '../../errors';

describe('extractPermissionGrantSortParameters', () => {
	it('should return undefined values when no sort is provided', () => {
		expect(extractPermissionGrantSortParameters({ query: {} })).toEqual({
			sortField: undefined,
			sortDirection: undefined,
		});
	});

	it('should sort ascending when the field has no prefix', () => {
		expect(
			extractPermissionGrantSortParameters({
				query: { _sort: 'createdByUserName' },
			}),
		).toEqual({
			sortField: 'createdByUserName',
			sortDirection: 'asc',
		});
	});

	it('should sort descending when the field has a `-` prefix', () => {
		expect(
			extractPermissionGrantSortParameters({
				query: { _sort: '-createdAt' },
			}),
		).toEqual({
			sortField: 'createdAt',
			sortDirection: 'desc',
		});
	});

	it('should throw an error when the field is not sortable', () => {
		expect(() =>
			extractPermissionGrantSortParameters({
				query: { _sort: 'verbs' },
			}),
		).toThrow(InputValidationError);
	});

	it('should throw an error when the field has more than one prefix', () => {
		expect(() =>
			extractPermissionGrantSortParameters({
				query: { _sort: '--id' },
			}),
		).toThrow(InputValidationError);
	});

	it('should throw an error when more than one sort is provided', () => {
		expect(() =>
			extractPermissionGrantSortParameters({
				query: { _sort: ['id', 'createdAt'] },
			}),
		).toThrow(InputValidationError);
	});
});
