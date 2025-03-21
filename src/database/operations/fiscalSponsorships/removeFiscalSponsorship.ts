import { generateRemoveItemOperation } from '../generators';
import type { FiscalSponsorship } from '../../../types';

const removeFiscalSponsorship = generateRemoveItemOperation<
	FiscalSponsorship,
	[fiscalSponseeChangemakerId: number, fiscalSponsorChangemakerId: number]
>('fiscalSponsorships.deleteOne', 'FiscalSponsorship', [
	'fiscalSponseeChangemakerId',
	'fiscalSponsorChangemakerId',
]);

export { removeFiscalSponsorship };
