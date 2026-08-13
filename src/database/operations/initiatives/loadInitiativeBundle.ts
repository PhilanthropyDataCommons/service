import { generateLoadBundleOperation } from '../generators';
import type { Id, Initiative } from '../../../types';

const loadInitiativeBundle = generateLoadBundleOperation<
	Initiative,
	[changemakerId: Id | undefined]
>('initiatives.selectWithPagination', ['changemakerId']);

export { loadInitiativeBundle };
