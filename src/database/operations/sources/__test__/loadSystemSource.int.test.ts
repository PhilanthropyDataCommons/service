import { db } from '../../../db';
import { loadSystemSource } from '..';
import {
	expectNumber,
	expectTimestamp,
} from '../../../../test/asymettricMatchers';

describe('loadSystemSource', () => {
	it('loads the expected system source', async () => {
		const systemSource = await loadSystemSource(db, null);
		expect(systemSource).toMatchObject({
			createdAt: expectTimestamp(),
			dataProvider: {
				createdAt: expectTimestamp(),
				name: 'The Philanthropy Data Commons',
				shortCode: 'pdc',
			},
			dataProviderShortCode: 'pdc',
			id: expectNumber(),
			label: 'The Philanthropy Data Commons',
		});
	});
});
