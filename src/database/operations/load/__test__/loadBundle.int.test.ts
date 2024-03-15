import { createOrganization, loadBundle } from '../../..';

describe('loadBundle', () => {
	it('Should return a bundle for the query', async () => {
		await createOrganization({
			employerIdentificationNumber: '11-1111111',
			name: 'Foo Inc.',
		});
		const objects = await loadBundle(
			'organizations.selectWithPagination',
			{
				limit: 10,
				offset: 0,
			},
			'organizations',
		);
		expect(objects).toMatchObject({
			total: 1,
			entries: [
				{
					createdAt: expect.any(Date) as Date,
					employerIdentificationNumber: '11-1111111',
					id: 1,
					name: 'Foo Inc.',
				},
			],
		});
	});
});
