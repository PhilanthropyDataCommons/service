import { generateExistsOperation } from '../generators';
import type { BaseFieldCategory, Id } from '../../../types';

const canCreateInitiativeFieldValue = generateExistsOperation<{
	initiativeId: Id;
	baseFieldCategory: BaseFieldCategory;
}>('authorization.canCreateInitiativeFieldValue', [
	'initiativeId',
	'baseFieldCategory',
]);

export { canCreateInitiativeFieldValue };
