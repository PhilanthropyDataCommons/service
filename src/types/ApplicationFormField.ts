import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { BaseField } from './BaseField';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';

interface ApplicationFormField {
	readonly id: number;
	applicationFormId: number;
	baseFieldShortCode: ShortCode;
	readonly baseField: BaseField;
	position: number;
	label: string;
	instructions: string | null;
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
		},
		required: ['baseFieldShortCode', 'position', 'label', 'instructions'],
	};

type ApplicationFormFieldPatch = Partial<
	Pick<ApplicationFormField, 'label' | 'instructions'>
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
		},
		additionalProperties: false,
		minProperties: 1,
	};

const isApplicationFormFieldPatch = ajv.compile(
	applicationFormFieldPatchSchema,
);

export {
	type ApplicationFormField,
	type ApplicationFormFieldPatch,
	type WritableApplicationFormField,
	type WritableApplicationFormFieldWithApplicationContext,
	isApplicationFormFieldPatch,
	writableApplicationFormFieldWithApplicationContextSchema,
};
