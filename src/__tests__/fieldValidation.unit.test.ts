import { fieldValueIsValid } from '../fieldValidation';
import { BaseFieldDataType } from '../types';

describe('field value validation against BaseFieldDataType', () => {
	test('validate a string as STRING', () => {
		expect(fieldValueIsValid('generic string', BaseFieldDataType.STRING)).toBe(
			true,
		);
	});
	test('validate a valid numeric string as NUMBER', () => {
		expect(fieldValueIsValid('123456', BaseFieldDataType.NUMBER)).toBe(true);
	});
	test('validate an invalid numeric string as NUMBER', () => {
		expect(fieldValueIsValid('abc123', BaseFieldDataType.NUMBER)).toBe(false);
	});
	test('validate a valid email string as EMAIL', () => {
		expect(fieldValueIsValid('abc@def.com', BaseFieldDataType.EMAIL)).toBe(
			true,
		);
	});
	test('validate an invalid email string as EMAIL', () => {
		expect(fieldValueIsValid('abcdef', BaseFieldDataType.EMAIL)).toBe(false);
	});
	test('validate a valid phone number as PHONE_NUMBER', () => {
		expect(
			fieldValueIsValid('18005555555', BaseFieldDataType.PHONE_NUMBER),
		).toBe(true);
		expect(
			fieldValueIsValid('+1(800)-555-5555', BaseFieldDataType.PHONE_NUMBER),
		).toBe(true);
		expect(
			fieldValueIsValid('800-555-5555', BaseFieldDataType.PHONE_NUMBER),
		).toBe(true);
	});
	test('validate an invalid phone number as PHONE_NUMBER', () => {
		expect(
			fieldValueIsValid(
				'112345678901234567890',
				BaseFieldDataType.PHONE_NUMBER,
			),
		).toBe(false);
		expect(fieldValueIsValid('123abc', BaseFieldDataType.PHONE_NUMBER)).toBe(
			false,
		);
		expect(fieldValueIsValid('      ', BaseFieldDataType.PHONE_NUMBER)).toBe(
			false,
		);
	});
	test('validate a valid boolean as BOOLEAN', () => {
		expect(fieldValueIsValid('true', BaseFieldDataType.BOOLEAN)).toBe(true);
		expect(fieldValueIsValid('false', BaseFieldDataType.BOOLEAN)).toBe(true);
		expect(fieldValueIsValid('True', BaseFieldDataType.BOOLEAN)).toBe(true);
		expect(fieldValueIsValid('False', BaseFieldDataType.BOOLEAN)).toBe(true);
	});
	test('validate an invalid boolean as BOOLEAN', () => {
		expect(fieldValueIsValid('true123', BaseFieldDataType.BOOLEAN)).toBe(false);
		expect(fieldValueIsValid('123false', BaseFieldDataType.BOOLEAN)).toBe(
			false,
		);
	});
	test('validate a valid URL as URL', () => {
		expect(
			fieldValueIsValid('https://www.test.com', BaseFieldDataType.URL),
		).toBe(true);
		expect(
			fieldValueIsValid('http://www.test.com', BaseFieldDataType.URL),
		).toBe(true);
	});
	test('validate an invalid URL as URL', () => {
		expect(fieldValueIsValid('testdotcom', BaseFieldDataType.URL)).toBe(false);
		expect(fieldValueIsValid('www.testdotcom', BaseFieldDataType.URL)).toBe(
			false,
		);
		expect(fieldValueIsValid('www.testdotcom.com', BaseFieldDataType.URL)).toBe(
			false,
		);
	});
});
