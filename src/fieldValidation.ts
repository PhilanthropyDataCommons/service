import validator from 'validator';
import { BaseFieldDataType, isId } from './types';
import { ajv } from './ajv';

const isEmailString = ajv.compile({
	type: 'string',
	format: 'email',
});

const isUrlString = ajv.compile({
	type: 'string',
	format: 'uri',
});

const isNumericString = (value: string): boolean => {
	const num = Number(value);
	return !isNaN(num) && isFinite(num);
};

const isBooleanString = (value: string): boolean =>
	value === 'true' || value === 'false';

const isString = ajv.compile({
	type: 'string',
});

// The validator package has only one phone number validator function,
// 'isMobilePhone.' but the PDC does not currently have any requirement
// for a phone number to be a mobile number, nor does the function seem
// to discriminate on landline numbers.
const isPhoneNumberString = (value: string): boolean =>
	validator.isMobilePhone(value);

const isCurrencyWithCodeString = (value: string): boolean => {
	const [currency, code] = value.split(' ');

	if (currency === undefined || code === undefined) {
		return false;
	}
	const currencyValidatorFields = {
		require_symbol: false,
		allow_negatives: false,
		require_decimal: true,
	};
	return (
		(validator.isCurrency(currency, {
			...currencyValidatorFields,
			thousands_separator: ',',
		}) ||
			validator.isCurrency(currency, {
				...currencyValidatorFields,
				thousands_separator: '',
			})) &&
		validator.isISO4217(code)
	);
};

const isIdString = (value: string): boolean => {
	if (value.trim() !== value) {
		return false;
	}
	const num = Number(value);
	if (isNaN(num) || !isFinite(num)) {
		return false;
	}
	return isId(num);
};

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
		case BaseFieldDataType.CURRENCY:
			return isCurrencyWithCodeString(fieldValue);
		case BaseFieldDataType.FILE:
			return isIdString(fieldValue);
		default:
			return isString(fieldValue);
	}
};
