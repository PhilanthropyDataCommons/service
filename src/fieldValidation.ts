import { phone } from 'phone';
import { BaseFieldDataType } from './types';
import { ajv } from './ajv';

const isEmailString = ajv.compile({
	type: 'string',
	format: 'email',
});

const isUrlString = ajv.compile({
	type: 'string',
	format: 'uri',
});

const isNumericString = ajv.compile({
	type: 'number',
});

const isBooleanString = ajv.compile({
	type: 'boolean',
});

const isString = ajv.compile({
	type: 'string',
});

const isPhoneNumberString = (value: string) => phone(value).isValid;

export const fieldValueIsValid = (
	fieldValue: string,
	dataType: BaseFieldDataType,
): boolean => {
	switch (dataType) {
		case BaseFieldDataType.NUMBER:
			return isNumericString(fieldValue);
		case BaseFieldDataType.PHONE_NUMBER:
			return isPhoneNumberString(fieldValue);
		case BaseFieldDataType.EMAIL:
			return isEmailString(fieldValue);
		case BaseFieldDataType.URL:
			return isUrlString(fieldValue);
		case BaseFieldDataType.BOOLEAN:
			return isBooleanString(fieldValue);
		default:
			return isString(fieldValue);
	}
};
