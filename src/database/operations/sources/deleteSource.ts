import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import { db } from '../../db';

const deleteSource = async (sourceId: number): Promise<void> => {
	const result = await db.sql('sources.deleteOne', {
		sourceId,
	});

	if (result.row_count === 0) {
		throw new NotFoundError(
			'The item did not exist and could not be deleted.',
			{
				entityType: 'Source',
				entityPrimaryKey: {
					sourceId,
				},
			},
		);
	}
};

export { deleteSource };
