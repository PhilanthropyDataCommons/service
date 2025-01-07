import { generateLoadItemOperation } from '../generators';
import type { ApplicationForm, Id } from '../../../types';

const loadApplicationForm = generateLoadItemOperation<
	ApplicationForm,
	[applicationFormId: Id]
>('applicationForms.selectById', 'ApplicationForm', ['applicationFormId']);

export { loadApplicationForm };
