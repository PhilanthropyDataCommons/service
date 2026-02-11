import { generateCreateOrUpdateItemOperation } from '../generators';
import { decorateWithFileDownloadUrls } from '../../../decorators/changemaker';
import type { Changemaker, WritableChangemaker } from '../../../types';

const createChangemaker = generateCreateOrUpdateItemOperation<
	Changemaker,
	WritableChangemaker,
	[]
>(
	'changemakers.insertOne',
	['taxId', 'name', 'keycloakOrganizationId'],
	[],
	decorateWithFileDownloadUrls,
);

export { createChangemaker };
