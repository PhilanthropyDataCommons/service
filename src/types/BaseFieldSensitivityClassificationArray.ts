import { ajv } from '../ajv';
import { baseFieldSensitivityClassificationSchema } from './BaseField';
import type { BaseFieldSensitivityClassification } from './BaseField';
import type { JSONSchemaType } from 'ajv';

export const baseFieldSensitivityClassificationArraySchema: JSONSchemaType<
	BaseFieldSensitivityClassification[]
> = {
	type: 'array',
	items: baseFieldSensitivityClassificationSchema,
};

export const isBaseFieldSensitivityClassificationArray = ajv.compile(
	baseFieldSensitivityClassificationArraySchema,
);
