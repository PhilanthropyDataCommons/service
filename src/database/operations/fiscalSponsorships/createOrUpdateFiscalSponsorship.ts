import { generateCreateOrUpdateItemOperation } from '../generators';
import { Writable } from '../../../types/Writable';
import type { Id } from '../../../types';

/**
 * A type designed to deal with the backend DB implementation and our generator
 * functions that probably does not need to be used elsewhere in the code. It
 * has two Ids that will be validated as Ids before ever getting to this point.
 * The type is only here and not exported because it is used twice here. If it is
 * found to be useful elsewhere, hoist it out to our general `types` directory
 * and export it from there following the usual pattern.
 */
interface FiscalSponsorship {
	fiscalSponseeChangemakerId: Id;
	fiscalSponsorChangemakerId: Id;
}

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
