import { generateCreateItemOperation } from '../generators';
import type { Initiative, WritableInitiative } from '../../../types';

const createInitiative = generateCreateItemOperation<
	Initiative,
	WritableInitiative,
	[]
>('initiatives.insertOne', ['changemakerId', 'title'], []);

export { createInitiative };
