import { generateUpsertItemOperation } from '../generators';
import type { FiscalSponsorship, Writable } from '../../../types';

const createOrUpdateFiscalSponsorship = generateUpsertItemOperation<
	FiscalSponsorship,
	Writable<FiscalSponsorship>,
	[]
>(
	'fiscalSponsorships.insertOrUpdateOne',
	['fiscalSponseeChangemakerId', 'fiscalSponsorChangemakerId'],
	[],
);

export { createOrUpdateFiscalSponsorship };
