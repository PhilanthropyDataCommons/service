import { loadObjects } from '..';
import { isOrganization, isProposal } from '../../../../types';
import { InternalValidationError } from '../../../../errors';
import { createOrganization } from '../../..';

describe('loadObjects', () => {
	it('Should return objects provided by the database', async () => {
		await createOrganization({
			employerIdentificationNumber: '11-1111111',
			name: 'Foo Inc.',
		});
		const objects = await loadObjects(
			'organizations.selectWithPagination',
			{
				limit: 10,
				offset: 0,
			},
			isOrganization,
		);
		expect(objects).toMatchObject([
			{
				createdAt: expect.any(Date) as Date,
				employerIdentificationNumber: '11-1111111',
				id: 1,
			},
		]);
	});

	it('Should throw an error if the format returned by the database does not align with the expected schema', async () => {
		await createOrganization({
			employerIdentificationNumber: '11-1111111',
			name: 'Foo Inc.',
		});
		await expect(
			loadObjects(
				'organizations.selectWithPagination',
				{
					limit: 10,
					offset: 0,
				},
				isProposal,
			),
		).rejects.toBeInstanceOf(InternalValidationError);
	});
});
