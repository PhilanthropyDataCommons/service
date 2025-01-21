import { generateCreateOrUpdateItemOperation } from '../generators';
import type { Changemaker, WritableChangemaker } from '../../../types';

const createChangemaker = generateCreateOrUpdateItemOperation<
	Changemaker,
	WritableChangemaker,
	[]
>('changemakers.insertOne', ['taxId', 'name', 'keycloakOrganizationId'], []);

export { createChangemaker };
