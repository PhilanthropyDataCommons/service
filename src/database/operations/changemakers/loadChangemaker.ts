import { generateLoadItemOperation } from '../generators';
import type { Changemaker, Id } from '../../../types';

const loadChangemaker = generateLoadItemOperation<
	Changemaker,
	[changemakerId: Id]
>('changemakers.selectById', 'Changemaker', ['changemakerId']);

export { loadChangemaker };
