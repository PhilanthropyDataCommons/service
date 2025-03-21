import { generateCreateOrUpdateItemOperation } from '../generators';
import { Writable } from '../../../types/Writable';
import type { FiscalSponsorship } from '../../../types';

const createOrUpdateFiscalSponsorship = generateCreateOrUpdateItemOperation<
	FiscalSponsorship,
	Writable<FiscalSponsorship>,
	[]
>(
	'fiscalSponsorships.insertOrUpdateOne',
	['fiscalSponseeChangemakerId', 'fiscalSponsorChangemakerId'],
	[],
);

export { createOrUpdateFiscalSponsorship };
