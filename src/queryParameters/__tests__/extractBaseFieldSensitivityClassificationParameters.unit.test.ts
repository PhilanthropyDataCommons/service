import { extractBaseFieldSensitivityClassificationsParameter } from '..';
import { InputValidationError } from '../../errors';
import { BaseFieldSensitivityClassification } from '../../types';

describe('extractBaseFieldSensitivityClassificationsParameter', () => {
	it('should return negated parameters with leading exclamation', () => {
		const sensitivityParameters =
			extractBaseFieldSensitivityClassificationsParameter({
				query: {
					sensitivityClassifications: '!["public"]',
				},
			});
		expect(sensitivityParameters).toStrictEqual({
			negated: true,
			list: [BaseFieldSensitivityClassification.PUBLIC],
		});
	});

	it('should return non-negated parameters without a leading exclamation', () => {
		const sensitivityParameters =
			extractBaseFieldSensitivityClassificationsParameter({
				query: {
					sensitivityClassifications: '["forbidden", "restricted"]',
				},
			});
		expect(sensitivityParameters).toStrictEqual({
			negated: false,
			list: [
				BaseFieldSensitivityClassification.FORBIDDEN,
				BaseFieldSensitivityClassification.RESTRICTED,
			],
		});
	});
	it('should throw an error when sensitivity classifications are not part of the enum', () => {
		expect(() =>
			extractBaseFieldSensitivityClassificationsParameter({
				query: {
					sensitivityClassifications: '["totally invalid classification"]',
				},
			}),
		).toThrow(InputValidationError);
	});

	it('should throw an error when given un-`JSON.parse`-able input', () => {
		expect(() =>
			extractBaseFieldSensitivityClassificationsParameter({
				query: {
					sensitivityClassifications: "this ain't a JSON list",
				},
			}),
		).toThrow(InputValidationError);
	});

	it('should throw an error when given a JSON object instead of array', () => {
		expect(() =>
			extractBaseFieldSensitivityClassificationsParameter({
				query: {
					sensitivityClassifications: '{"this": "is an object, not an array"}',
				},
			}),
		).toThrow(InputValidationError);
	});
});
