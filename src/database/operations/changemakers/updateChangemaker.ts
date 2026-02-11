import { generateCreateOrUpdateItemOperation } from '../generators';
import { decorateWithFileDownloadUrls } from '../../../decorators/changemaker';
import type { Changemaker, Id, WritableChangemaker } from '../../../types';

const updateChangemaker = generateCreateOrUpdateItemOperation<
	Changemaker,
	Partial<WritableChangemaker>,
	[changemakerId: Id]
>(
	'changemakers.updateById',
	['taxId', 'name', 'keycloakOrganizationId'],
	['changemakerId'],
	decorateWithFileDownloadUrls,
);

export { updateChangemaker };
