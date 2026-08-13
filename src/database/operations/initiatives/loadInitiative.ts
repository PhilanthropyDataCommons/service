import { generateLoadItemOperation } from '../generators';
import type { Id, Initiative } from '../../../types';

const loadInitiative = generateLoadItemOperation<
	Initiative,
	[initiativeId: Id]
>('initiatives.selectById', 'Initiative', ['initiativeId']);

export { loadInitiative };
