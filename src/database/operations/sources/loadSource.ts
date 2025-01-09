import { generateLoadItemOperation } from '../generators';
import type { Id, Source } from '../../../types';

const loadSource = generateLoadItemOperation<Source, [sourceId: Id]>(
	'sources.selectById',
	'Source',
	['sourceId'],
);

export { loadSource };
