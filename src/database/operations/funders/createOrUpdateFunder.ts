import { generateUpsertItemOperation } from '../generators';
import type { Funder, InternallyWritableFunder } from '../../../types';

const createOrUpdateFunder = generateUpsertItemOperation<
	Funder,
	InternallyWritableFunder,
	[]
>(
	'funders.insertOrUpdateOne',
	[
		'shortCode',
		'name',
		'keycloakOrganizationId',
		'isCollaborative',
		'defaultTerminologySetId',
	],
	[],
);

export { createOrUpdateFunder };
