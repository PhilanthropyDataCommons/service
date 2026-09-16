import { generateUpdateItemOperation } from '../generators';
import type { Id, Source, SourcePatch } from '../../../types';

const updateSource = generateUpdateItemOperation<
	Source,
	SourcePatch,
	[sourceId: Id]
>('sources.updateById', ['label'], ['sourceId']);

export { updateSource };
