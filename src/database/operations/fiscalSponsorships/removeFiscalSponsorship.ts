import { NotFoundError } from '../../../errors';
import { db } from '../../db';
import type { Id } from '../../../types';

const removeFiscalSponsorship = async (
	fiscalSponseeChangemakerId: Id,
	fiscalSponsorChangemakerId: Id,
): Promise<void> => {
	const result = await db.sql('fiscalSponsorships.deleteOne', {
		fiscalSponseeChangemakerId,
		fiscalSponsorChangemakerId,
	});

	if (result.row_count === 0) {
		throw new NotFoundError(
			'The item did not exist and could not be deleted.',
			{
				entityType: 'FiscalSponsorship',
				entityPrimaryKey: {
					fiscalSponseeChangemakerId,
					fiscalSponsorChangemakerId,
				},
			},
		);
	}
};

export { removeFiscalSponsorship };
