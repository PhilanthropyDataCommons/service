import { generateLoadBundleOperation } from '../generators';
import type { DataProvider } from '../../../types';

const loadDataProviderBundle = generateLoadBundleOperation<DataProvider, []>(
	'dataProviders.selectWithPagination',
	'data_providers',
	[],
);

export { loadDataProviderBundle };
