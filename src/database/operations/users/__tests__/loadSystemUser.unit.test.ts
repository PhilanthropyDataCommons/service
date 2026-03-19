import { loadSystemUser } from '../loadSystemUser';
import { NotFoundError } from '../../../../errors';

describe('loadSystemUser', () => {
	it('should throw an error if the database does not return a system user value', async () => {
		const mockDb = {
			sql: jest.fn().mockResolvedValueOnce({
				command: '',
				row_count: 0,
				rows: [],
			}),
		};

		await expect(loadSystemUser(mockDb, null)).rejects.toThrow(NotFoundError);
	});
});
