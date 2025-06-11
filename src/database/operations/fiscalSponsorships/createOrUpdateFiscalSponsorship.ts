import { generateCreateOrUpdateItemOperation } from '../generators';
import type { FiscalSponsorship, Writable } from '../../../types';

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
