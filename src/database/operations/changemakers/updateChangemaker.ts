import { generateCreateOrUpdateItemOperation } from '../generators';
import type { Changemaker, Id, WritableChangemaker } from '../../../types';

const updateChangemaker = generateCreateOrUpdateItemOperation<
	Changemaker,
	Partial<WritableChangemaker>,
	[changemakerId: Id]
>(
	'changemakers.updateById',
	['taxId', 'name', 'keycloakOrganizationId'],
	['changemakerId'],
);

export { updateChangemaker };
