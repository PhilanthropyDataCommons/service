import { db } from '../../../db';
import { loadSystemSource } from '..';
import { expectTimestamp } from '../../../../test/utils';

describe('loadSystemSource', () => {
	it('loads the expected system source', async () => {
		const systemSource = await loadSystemSource(db, null);
		expect(systemSource).toMatchObject({
			createdAt: expectTimestamp,
			dataProvider: {
				createdAt: expectTimestamp,
				name: 'The Philanthropy Data Commons',
				shortCode: 'pdc',
			},
			dataProviderShortCode: 'pdc',
			id: expect.any(Number) as number,
			label: 'The Philanthropy Data Commons',
		});
	});
});
