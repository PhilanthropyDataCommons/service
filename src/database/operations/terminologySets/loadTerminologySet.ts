import { generateLoadItemOperation } from '../generators';
import type { Id, TerminologySet } from '../../../types';

const loadTerminologySet = generateLoadItemOperation<
	TerminologySet,
	[terminologySetId: Id]
>('terminologySets.selectById', 'TerminologySet', ['terminologySetId']);

export { loadTerminologySet };
