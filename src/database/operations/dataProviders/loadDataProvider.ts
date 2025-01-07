import { generateLoadItemOperation } from '../generators';
import type { DataProvider, ShortCode } from '../../../types';

const loadDataProvider = generateLoadItemOperation<
	DataProvider,
	[dataProviderShortCode: ShortCode]
>('dataProviders.selectByShortCode', 'DataProvider', ['dataProviderShortCode']);

export { loadDataProvider };
