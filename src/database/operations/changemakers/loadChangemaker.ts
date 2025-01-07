import { generateLoadItemOperation } from '../generators';
import type { Changemaker, Id, KeycloakId } from '../../../types';

const loadChangemaker = generateLoadItemOperation<
	Changemaker,
	[authContextKeycloakUserId: KeycloakId | undefined, changemakerId: Id]
>('changemakers.selectById', 'Changemaker', [
	'authContextKeycloakUserId',
	'changemakerId',
]);

export { loadChangemaker };
