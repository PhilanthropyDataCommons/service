import { isPaginationParameters } from '../../types';
import { InternalValidationError } from '../../errors';
import type { PaginationParameters } from '../../types';

interface LimitValues {
	limit: number | undefined;
	offset: number;
}

const API_PAGE_OFFSET = 1;
const apiPageToZeroIndexedPage = (page: number): number =>
	page - API_PAGE_OFFSET;

export const getLimitValues = (
	paginationParameters: PaginationParameters,
): LimitValues => {
	if (!isPaginationParameters(paginationParameters)) {
		throw new InternalValidationError(
			'Invalid pagination parameters',
			isPaginationParameters.errors ?? [],
		);
	}
	const zeroIndexedPage = apiPageToZeroIndexedPage(paginationParameters.page);
	const { count: limit } = paginationParameters;
	const offset = paginationParameters.count * zeroIndexedPage;
	return {
		limit,
		offset,
	};
};
