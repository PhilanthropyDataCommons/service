import { generateRemoveItemOperation } from '../generators';
import type { Source, Id } from '../../../types';

const removeSource = generateRemoveItemOperation<Source, [sourceId: Id]>(
	'sources.deleteOne',
	'Source',
	['sourceId'],
);

export { removeSource };
