import { generateLoadBundleOperation } from '../generators';
import type { ExpandedParameterFilter } from '../../parameters';
import type {
	BaseField,
	BaseFieldSensitivityClassification,
} from '../../../types';

const loadBaseFieldBundle = generateLoadBundleOperation<
	BaseField,
	[
		sensitivityFilter: ExpandedParameterFilter<BaseFieldSensitivityClassification>,
	]
>('baseFields.selectWithPagination', ['sensitivityFilter']);

export { loadBaseFieldBundle };
