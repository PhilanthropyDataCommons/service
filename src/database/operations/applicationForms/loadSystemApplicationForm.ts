import { generateLoadItemOperation } from '../generators';
import type { ApplicationForm } from '../../../types';

const loadSystemApplicationForm = generateLoadItemOperation<
	ApplicationForm,
	[]
>('applicationForms.selectSystemApplicationForm', 'ApplicationForm', []);

export { loadSystemApplicationForm };
