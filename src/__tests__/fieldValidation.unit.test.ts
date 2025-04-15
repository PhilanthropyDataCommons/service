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
		expect(fieldValueIsValid(' 123456 ', BaseFieldDataType.NUMBER)).toBe(true);
	});
	test('validate an invalid numeric string as NUMBER', () => {
		expect(fieldValueIsValid('abc123', BaseFieldDataType.NUMBER)).toBe(false);
		expect(fieldValueIsValid('abc123    4', BaseFieldDataType.NUMBER)).toBe(
			false,
		);
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
	});
	test('validate an invalid boolean as BOOLEAN', () => {
		expect(fieldValueIsValid('true123', BaseFieldDataType.BOOLEAN)).toBe(false);
		expect(fieldValueIsValid('123false', BaseFieldDataType.BOOLEAN)).toBe(
			false,
		);
		expect(fieldValueIsValid('TrUE', BaseFieldDataType.BOOLEAN)).toBe(false);
		expect(fieldValueIsValid('FaLSE', BaseFieldDataType.BOOLEAN)).toBe(false);
	});
	test('validate a valid url as URL', () => {
		expect(
			fieldValueIsValid('https://www.test.com', BaseFieldDataType.URL),
		).toBe(true);
		expect(
			fieldValueIsValid('http://www.test.com', BaseFieldDataType.URL),
		).toBe(true);
	});
	test('validate an invalid url as URL', () => {
		expect(fieldValueIsValid('testdotcom', BaseFieldDataType.URL)).toBe(false);
		expect(fieldValueIsValid('www.testdotcom', BaseFieldDataType.URL)).toBe(
			false,
		);
		expect(fieldValueIsValid('www.testdotcom.com', BaseFieldDataType.URL)).toBe(
			false,
		);
	});
	test('validate a valid currency as CURRENCY', () => {
		expect(
			fieldValueIsValid('1000000.00 CAD', BaseFieldDataType.CURRENCY),
		).toBe(true);
		expect(
			fieldValueIsValid('1,000,000.00 USD', BaseFieldDataType.CURRENCY),
		).toBe(true);
		expect(fieldValueIsValid('7.00 USD', BaseFieldDataType.CURRENCY)).toBe(
			true,
		);
	});
	test('validate an invalid currency as not CURRENCY', () => {
		expect(fieldValueIsValid('1000000.00', BaseFieldDataType.CURRENCY)).toBe(
			false,
		);
		expect(fieldValueIsValid('1000000.00', BaseFieldDataType.CURRENCY)).toBe(
			false,
		);
		expect(fieldValueIsValid('1.000.000.00', BaseFieldDataType.CURRENCY)).toBe(
			false,
		);
		expect(
			fieldValueIsValid(
				'1000000.00 NOTAREALCURRENCYTAG',
				BaseFieldDataType.CURRENCY,
			),
		).toBe(false);
		expect(fieldValueIsValid('1000.001 USD', BaseFieldDataType.CURRENCY)).toBe(
			false,
		);
		expect(fieldValueIsValid('1000 USD', BaseFieldDataType.CURRENCY)).toBe(
			false,
		);
		expect(
			fieldValueIsValid('1000.00 1000.00 USD', BaseFieldDataType.CURRENCY),
		).toBe(false);
		expect(fieldValueIsValid('100 USD', BaseFieldDataType.CURRENCY)).toBe(
			false,
		);
		expect(fieldValueIsValid('USD', BaseFieldDataType.CURRENCY)).toBe(false);
		expect(fieldValueIsValid('1000.001 USD', BaseFieldDataType.CURRENCY)).toBe(
			false,
		);
	});
});
