import { loadTableMetrics } from '..';
import { db } from '../../..';
import { expectDate } from '../../../../test/asymettricMatchers';

describe('loadTableMetrics', () => {
	it('Should reflect metrics properly for an empty table', async () => {
		const metrics = await loadTableMetrics('changemakers');
		expect(metrics).toMatchObject({
			count: 0,
			now: expectDate(),
		});
	});

	it('Should throw an error if no metrics were returned by the database', async () => {
		jest.spyOn(db, 'query').mockImplementationOnce(async () => ({
			rows: [],
			command: '',
			row_count: 0,
		}));

		await expect(loadTableMetrics('changemakers')).rejects.toThrow(
			'Something went wrong collecting table metrics for changemakers',
		);
	});
});
