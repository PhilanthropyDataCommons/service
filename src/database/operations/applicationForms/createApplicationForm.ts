import { generateCreateItemOperation } from '../generators';
import type { ApplicationForm, WritableApplicationForm } from '../../../types';

const createApplicationForm = generateCreateItemOperation<
	ApplicationForm,
	WritableApplicationForm,
	[]
>('applicationForms.insertOne', ['opportunityId', 'name'], []);

export { createApplicationForm };
