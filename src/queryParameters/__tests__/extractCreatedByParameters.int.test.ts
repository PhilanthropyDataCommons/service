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

	it('should pass along the uuid value when one is provided', () => {
		const paginationParameters = extractCreatedByParameters({
			query: {
				createdBy: '12345678-1234-1234-1234-123456789012',
			},
		});
		expect(paginationParameters).toEqual({
			createdBy: '12345678-1234-1234-1234-123456789012',
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
			createdBy: testUser.keycloakUserId,
		});
	});

	it('should throw an error when a non-uuid is provided', () => {
		expect(() =>
			extractCreatedByParameters({
				query: {
					createdBy: 'this is not a UUID',
				},
			}),
		).toThrow(InputValidationError);
	});
});
