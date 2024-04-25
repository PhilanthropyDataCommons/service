import { extractCreatedByParameters } from '..';
import { InputValidationError } from '../../errors';
import { loadTestUser } from '../../test/utils';

describe('extractCreatedByParameters', () => {
	it('should return undefined when passed no createdBy value', () => {
		const createdByParameters = extractCreatedByParameters({
			query: {},
		});
		expect(createdByParameters).toEqual({
			createdBy: undefined,
		});
	});

	it('should pass along the numeric value when one is provided', () => {
		const paginationParameters = extractCreatedByParameters({
			query: {
				createdBy: '42',
			},
		});
		expect(paginationParameters).toEqual({
			createdBy: 42,
		});
	});

	it('should return undefined when passed `me` with no authContext', () => {
		const createdByParameters = extractCreatedByParameters({
			query: { createdBy: 'me' },
		});
		expect(createdByParameters).toEqual({
			createdBy: undefined,
		});
	});

	it('should return the current user when passed `me` and an auth context', async () => {
		const testUser = await loadTestUser();
		const createdByParameters = extractCreatedByParameters({
			query: { createdBy: 'me' },
			user: testUser,
		});
		expect(createdByParameters).toEqual({
			createdBy: testUser.id,
		});
	});

	it('should throw an error when strings that parse to NaN are provided', () => {
		expect(() =>
			extractCreatedByParameters({
				query: {
					createdBy: 'forty two',
				},
			}),
		).toThrow(InputValidationError);
	});

	it('should throw an error when strings that parse to floats are provided', () => {
		expect(() =>
			extractCreatedByParameters({
				query: {
					createdBy: '42.6',
				},
			}),
		).toThrow(InputValidationError);
	});

	it('should throw an error when strings that parse to numbers less than 1 are provided', () => {
		expect(() =>
			extractCreatedByParameters({
				query: {
					createdBy: '0',
				},
			}),
		).toThrow(InputValidationError);
	});
});
