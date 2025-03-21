import type { FiscalSponsorship } from '../../../types';
import { generateRemoveItemOperation } from '../generators';

const removeFiscalSponsorship = generateRemoveItemOperation<
	FiscalSponsorship,
	[fiscalSponseeChangemakerId: number, fiscalSponsorChangemakerId: number]
>('fiscalSponsorships.deleteOne', 'FiscalSponsorship', [
	'fiscalSponseeChangemakerId',
	'fiscalSponsorChangemakerId',
]);

export { removeFiscalSponsorship };
