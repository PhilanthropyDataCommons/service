import { generateUpdateItemOperation } from '../generators';
import type { Id, Initiative, InitiativePatch } from '../../../types';

const updateInitiative = generateUpdateItemOperation<
	Initiative,
	InitiativePatch,
	[initiativeId: Id]
>('initiatives.updateById', ['title'], ['initiativeId']);

export { updateInitiative };
