import { loadSystemUser } from '../loadSystemUser';
import { db } from '../../../db';
import { NotFoundError } from '../../../../errors';

describe('loadSystemUser', () => {
	it('should throw an error if the database does not return a system user value', async () => {
		jest.spyOn(db, 'sql').mockImplementationOnce(async () => ({
			command: '',
			row_count: 0,
			rows: [],
		}));

		await expect(loadSystemUser(db, null)).rejects.toThrow(NotFoundError);
	});
});
