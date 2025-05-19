import { generateCreateOrUpdateItemOperation } from '../generators';
import type { Funder, InternallyWritableFunder } from '../../../types';

const createOrUpdateFunder = generateCreateOrUpdateItemOperation<
	Funder,
	InternallyWritableFunder,
	[]
>(
	'funders.insertOrUpdateOne',
	['shortCode', 'name', 'keycloakOrganizationId', 'isCollaborative'],
	[],
);

export { createOrUpdateFunder };
