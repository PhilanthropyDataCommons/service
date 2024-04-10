import { phone } from 'phone';
import { BaseFieldDataType } from './types';

export const fieldValueIsValid = (
	fieldValue: string,
	dataType: BaseFieldDataType,
) => {
	switch (dataType) {
		case BaseFieldDataType.NUMBER:
			return /^[0-9]*$/.test(fieldValue);
		case BaseFieldDataType.PHONE_NUMBER:
			return phone(fieldValue).isValid;
		case BaseFieldDataType.EMAIL:
			return /^\S+@\S+$/.test(fieldValue);
		case BaseFieldDataType.URL:
			return /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/.test(
				fieldValue,
			);
		case BaseFieldDataType.BOOLEAN:
			return /^(true|false)$/i.test(fieldValue);
		default:
			return true;
	}
};