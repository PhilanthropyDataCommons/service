import { generateLoadBundleOperation } from '../generators';
import type { Changemaker, KeycloakId } from '../../../types';

const loadChangemakerBundle = generateLoadBundleOperation<
	Changemaker,
	[
		authContextKeycloakUserId: KeycloakId | undefined,
		proposalId: number | undefined,
	]
>('changemakers.selectWithPagination', 'changemakers', [
	'authContextKeycloakUserId',
	'proposalId',
]);

export { loadChangemakerBundle };
