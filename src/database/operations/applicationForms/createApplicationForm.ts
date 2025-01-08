import { generateCreateOrUpdateItemOperation } from '../generators';
import type { ApplicationForm, WritableApplicationForm } from '../../../types';

const createApplicationForm = generateCreateOrUpdateItemOperation<
	ApplicationForm,
	WritableApplicationForm
>('applicationForms.insertOne', ['opportunityId']);

export { createApplicationForm };
