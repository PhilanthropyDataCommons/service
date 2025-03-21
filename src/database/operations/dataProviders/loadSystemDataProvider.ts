import { generateLoadItemOperation } from '../generators';
import type { DataProvider } from '../../../types';

const loadSystemDataProvider = generateLoadItemOperation<DataProvider, []>(
	'dataProviders.selectSystemDataProvider',
	'DataProvider',
	[],
);
export { loadSystemDataProvider };
