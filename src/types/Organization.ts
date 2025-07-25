import type { ShallowChangemaker } from './Changemaker';
import type { DataProvider } from './DataProvider';
import type { Funder } from './Funder';

/** An organization may have zero to three functions (changemaker, funder, data provider). */
interface Organization {
	readonly changemaker: ShallowChangemaker | null;
	readonly dataProvider: DataProvider | null;
	readonly funder: Funder | null;
}

export { type Organization };
