import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { BaseField } from './BaseField';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';

enum ApplicationFormFieldInputType {
	SHORT_TEXT = 'shortText',
	LONG_TEXT = 'longText',
	RADIO = 'radio',
	DROPDOWN = 'dropdown',
	MULTISELECT = 'multiselect',
	HIDDEN = 'hidden',
}

interface ApplicationFormField {
	readonly id: number;
	applicationFormId: number;
	baseFieldShortCode: ShortCode;
	readonly baseField: BaseField;
	position: number;
	label: string;
	instructions: string | null;
	inputType: ApplicationFormFieldInputType | null;
	readonly createdAt: string;
}

type WritableApplicationFormField = Writable<ApplicationFormField>;

type WritableApplicationFormFieldWithApplicationContext = Omit<
	WritableApplicationFormField,
	'applicationFormId'
>;

const writableApplicationFormFieldWithApplicationContextSchema: JSONSchemaType<WritableApplicationFormFieldWithApplicationContext> =
	{
		type: 'object',
		properties: {
			baseFieldShortCode: {
				type: 'string',
			},
			position: {
				type: 'integer',
			},
			label: {
				type: 'string',
			},
			instructions: {
				type: 'string',
				/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
				 * This is a gross workaround for the fact that AJV does not support nullable types in TypeScript.
				 * See: https://github.com/ajv-validator/ajv/issues/2163
				 */
				nullable: true as false,
			},
			inputType: {
				type: 'string',
				/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
				 * null must be included in the enum for AJV to accept null values even when nullable is true.
				 * The cast is needed because JSONSchemaType does not support nullable enum types in TypeScript.
				 * See: https://github.com/ajv-validator/ajv/issues/2163
				 */
				enum: [
					...Object.values(ApplicationFormFieldInputType),
					null,
				] as ApplicationFormFieldInputType[],
				/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
				 * This is a gross workaround for the fact that AJV does not support nullable types in TypeScript.
				 * See: https://github.com/ajv-validator/ajv/issues/2163
				 */
				nullable: true as false,
			},
		},
		required: [
			'baseFieldShortCode',
			'position',
			'label',
			'instructions',
			'inputType',
		],
	};

type ApplicationFormFieldPatch = Partial<
	Pick<ApplicationFormField, 'label' | 'instructions' | 'inputType'>
>;

const applicationFormFieldPatchSchema: JSONSchemaType<ApplicationFormFieldPatch> =
	{
		type: 'object',
		properties: {
			label: {
				type: 'string',
				nullable: true,
			},
			instructions: {
				type: 'string',
				nullable: true,
			},
			inputType: {
				type: 'string',
				enum: Object.values(ApplicationFormFieldInputType),
				nullable: true,
			},
		},
		additionalProperties: false,
		minProperties: 1,
	};

const isApplicationFormFieldPatch = ajv.compile(
	applicationFormFieldPatchSchema,
);

export {
	ApplicationFormFieldInputType,
	type ApplicationFormField,
	type ApplicationFormFieldPatch,
	type WritableApplicationFormField,
	type WritableApplicationFormFieldWithApplicationContext,
	isApplicationFormFieldPatch,
	writableApplicationFormFieldWithApplicationContextSchema,
};
