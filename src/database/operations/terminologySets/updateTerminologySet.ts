import { generateUpdateItemOperation } from '../generators';
import type { Id, TerminologySet, TerminologySetPatch } from '../../../types';

const updateTerminologySet = generateUpdateItemOperation<
	TerminologySet,
	TerminologySetPatch,
	[terminologySetId: Id]
>(
	'terminologySets.updateById',
	[
		'name',
		'opportunityLabel',
		'opportunitiesLabel',
		'applicationFormLabel',
		'applicationFormsLabel',
		'proposalLabel',
		'proposalsLabel',
	],
	['terminologySetId'],
);

export { updateTerminologySet };
