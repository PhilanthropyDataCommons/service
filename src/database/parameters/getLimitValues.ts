import { isPaginationParameters } from '../../types';
import { InternalValidationError } from '../../errors';
import type { PaginationParameters } from '../../types';

interface LimitValues {
	limit: number | undefined;
	offset: number;
}

export const getLimitValues = (
	paginationParameters: PaginationParameters,
): LimitValues => {
	if (!isPaginationParameters(paginationParameters)) {
		throw new InternalValidationError(
			'Invalid pagination parameters',
			isPaginationParameters.errors ?? [],
		);
	}
	const zeroIndexedPage = paginationParameters.page - 1;
	const limit = paginationParameters.count;
	const offset = paginationParameters.count * zeroIndexedPage;
	return {
		limit,
		offset,
	};
};
