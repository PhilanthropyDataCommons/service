import { generateLoadBundleOperation } from '../generators';
import type { ApplicationForm } from '../../../types';

export const loadApplicationFormBundle = generateLoadBundleOperation<
	ApplicationForm,
	[]
>('applicationForms.selectWithPagination', 'application_forms', []);
