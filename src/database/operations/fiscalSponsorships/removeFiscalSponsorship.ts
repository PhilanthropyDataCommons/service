import { generateRemoveItemOperation } from '../generators';
import type { FiscalSponsorship, Id } from '../../../types';

const removeFiscalSponsorship = generateRemoveItemOperation<
	FiscalSponsorship,
	[fiscalSponseeChangemakerId: Id, fiscalSponsorChangemakerId: Id]
>('fiscalSponsorships.deleteOne', 'FiscalSponsorship', [
	'fiscalSponseeChangemakerId',
	'fiscalSponsorChangemakerId',
]);

export { removeFiscalSponsorship };
