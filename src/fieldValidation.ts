import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { phone } from 'phone';
import { BaseFieldDataType } from './types';

const ajv = new Ajv();
addFormats(ajv, ['email', 'uri']);

function isValidEmail(email: string): boolean {
	const emailSchema = {
		type: 'string',
		format: 'email',
	};

	return ajv.validate(emailSchema, email);
}

function isValidUrl(url: string): boolean {
	const uriSchema = {
		type: 'string',
		format: 'uri',
	};
	return ajv.validate(uriSchema, url);
}

function isValidPhoneNumber(phoneNumber: string): boolean {
	return phone(phoneNumber).isValid;
}

export const fieldValueIsValid = (
	fieldValue: string,
	dataType: BaseFieldDataType,
): boolean => {
	switch (dataType) {
		case BaseFieldDataType.NUMBER:
			return /^[0-9]*$/.test(fieldValue);
		case BaseFieldDataType.PHONE_NUMBER:
			return isValidPhoneNumber(fieldValue);
		case BaseFieldDataType.EMAIL:
			return isValidEmail(fieldValue);
		case BaseFieldDataType.URL:
			return isValidUrl(fieldValue);
		case BaseFieldDataType.BOOLEAN:
			return /^(true|false)$/i.test(fieldValue);
		default:
			return true;
	}
};
