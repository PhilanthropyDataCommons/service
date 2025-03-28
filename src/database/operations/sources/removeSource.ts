import { Source, Id } from '../../../types';
import { generateRemoveItemOperation } from '../generators';

const removeSource = generateRemoveItemOperation<Source, [sourceId: Id]>(
	'sources.deleteOne',
	'Source',
	['sourceId'],
);

export { removeSource };
