import { BaseFieldCategory } from './BaseField';
import { PermissionGrantEntityType } from './PermissionGrantEntityType';

interface PermissionGrantCondition {
	property: string;
	operator: string;
	value: string[];
}

const scopeConditions = {
	[PermissionGrantEntityType.CHANGEMAKER]: [],
	[PermissionGrantEntityType.FUNDER]: [],
	[PermissionGrantEntityType.DATA_PROVIDER]: [],
	[PermissionGrantEntityType.OPPORTUNITY]: [],
	[PermissionGrantEntityType.PROPOSAL]: [],
	[PermissionGrantEntityType.PROPOSAL_VERSION]: [],
	[PermissionGrantEntityType.APPLICATION_FORM]: [],
	[PermissionGrantEntityType.APPLICATION_FORM_FIELD]: [],
	[PermissionGrantEntityType.PROPOSAL_FIELD_VALUE]: [
		{
			property: 'baseFieldCategory',
			operator: 'in',
			value: Object.values(BaseFieldCategory),
		},
	],
	[PermissionGrantEntityType.SOURCE]: [],
	[PermissionGrantEntityType.BULK_UPLOAD]: [],
	[PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE]: [],
	[PermissionGrantEntityType.TERMINOLOGY_SET]: [],
	[PermissionGrantEntityType.ANY]: [],
} as const satisfies Record<
	PermissionGrantEntityType,
	readonly PermissionGrantCondition[]
>;

const permissionGrantConditionSchema = {
	type: 'object',
	properties: {
		property: { type: 'string' },
		operator: { type: 'string' },
		value: {
			type: 'array',
			items: { type: 'string' },
			minItems: 1,
		},
	},
	required: ['property', 'operator', 'value'],
	additionalProperties: false,
};

const getConditionsForScope = (
	scopeKey: PermissionGrantEntityType,
): readonly PermissionGrantCondition[] => scopeConditions[scopeKey];

export {
	getConditionsForScope,
	permissionGrantConditionSchema,
	type PermissionGrantCondition,
};
