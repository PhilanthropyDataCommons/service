import { generateLoadItemOperation } from '../generators';
import type { Changemaker } from '../../../types';

export const loadChangemakerByTaxId = generateLoadItemOperation<
	Changemaker,
	[taxId: string]
>('changemakers.selectByTaxId', 'Changemaker', ['taxId']);
