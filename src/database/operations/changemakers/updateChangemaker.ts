import { generateUpdateItemOperation } from '../generators';
import { decorateWithFileDownloadUrls } from '../../../decorators/changemaker';
import type { Changemaker, Id, WritableChangemaker } from '../../../types';

const updateChangemaker = generateUpdateItemOperation<
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
