import { generateCreateItemOperation } from '../generators';
import type { TerminologySet, WritableTerminologySet } from '../../../types';

const createTerminologySet = generateCreateItemOperation<
	TerminologySet,
	WritableTerminologySet,
	[]
>(
	'terminologySets.insertOne',
	[
		'funderShortCode',
		'name',
		'opportunityLabel',
		'opportunitiesLabel',
		'applicationFormLabel',
		'applicationFormsLabel',
		'proposalLabel',
		'proposalsLabel',
	],
	[],
);

export { createTerminologySet };
