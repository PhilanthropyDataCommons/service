// TODO: I expect this and the corresponding function will be moved somewhere TBD.
// TODO: Add more meaningful tests.

import {
	BaseField,
	BaseFieldDataType,
	BaseFieldScope,
	Organization,
	ProposalFieldValue,
} from '../../types';
import { extractGold } from '../organizationDetailHandlers';

describe('extractGold', () => {
	it('should return same contents when empty allFieldValues is passed', () => {
		const organization: Organization = {
			id: 5101,
			taxId: '05107',
			name: 'My org',
			createdAt: '2024-08-01T10:49:30-0600',
		};
		const organizationDetail = {
			organization,
			bestAvailableFieldValues: new Map(),
			allFieldValues: new Map(),
		};
		expect(extractGold(organizationDetail)).toEqual(organizationDetail);
	});

	it('should return the latest valid value for a base field', () => {
		const organization: Organization = {
			id: 5113,
			taxId: '05119',
			name: 'Five thousand one hundred forty seven reasons',
			createdAt: '2024-08-01T13:41:42-0600',
		};
		const allFieldValues = new Map<BaseField, ProposalFieldValue[]>();
		const baseField: BaseField = {
			id: 5153,
			label: 'Fifty one fifty three',
			shortCode: 'fifty_one_fifty_three',
			description: 'Five thousand one hundred fifty three.',
			dataType: BaseFieldDataType.EMAIL,
			scope: BaseFieldScope.ORGANIZATION,
			createdAt: '2024-08-01T13:48:02-0600',
		};
		const latestValueButInvalid: ProposalFieldValue = {
			id: 5167,
			proposalVersionId: 5171,
			applicationFormField: {
				id: 5189,
				applicationFormId: 5197,
				baseFieldId: 5153, // Intentionally the same as above.
				baseField, // Intentionally the same as above.
				position: 5209,
				label: 'Fifty one hundred and fifty three.',
				createdAt: '2024-08-01T13:52:03-0600',
			},
			applicationFormFieldId: 5227,
			position: 5231,
			value: 'invalid-email-address.com',
			isValid: false,
			createdAt: '2525-08-01T13:52:03-0600', // Intentionally absurdly late.
		};
		const validButEarliestValue: ProposalFieldValue = {
			id: 5233,
			proposalVersionId: 5237,
			applicationFormField: {
				id: 5261,
				applicationFormId: 5273,
				baseFieldId: 5153, // Intentionally the same as above.
				baseField, // Intentionally the same as above.
				position: 5279,
				label: 'Fitty one hunnert fitty tree.',
				createdAt: '2024-08-01T13:57:04-0600',
			},
			applicationFormFieldId: 5281,
			position: 5297,
			value: 'validbutold@emailaddress.com',
			isValid: true,
			createdAt: '1099-08-01T13:57:17-0600', // Intentionally absurdly early.
		};
		const latestValidValue: ProposalFieldValue = {
			id: 5303,
			proposalVersionId: 5309,
			applicationFormField: {
				id: 5323,
				applicationFormId: 5333,
				baseFieldId: 5153, // Intentionally the same as above.
				baseField, // Intentionally the same as above.
				position: 5347,
				label: 'Five thousand one hundred and fifty three.',
				createdAt: '2024-08-01T15:28:23-0600',
			},
			applicationFormFieldId: 5351,
			position: 5381,
			value: 'valid@emailaddress.com',
			isValid: true,
			createdAt: '2024-08-01T15:29:07-0600', // Between the above PFV.createdAt values.
		};
		allFieldValues.set(baseField, [
			latestValueButInvalid,
			validButEarliestValue,
			latestValidValue,
		]);
		const organizationDetail = {
			organization,
			bestAvailableFieldValues: new Map(),
			allFieldValues,
		};
		const expectedBest = new Map<BaseField, ProposalFieldValue>();
		expectedBest.set(baseField, latestValidValue);
		expect(extractGold(organizationDetail)).toEqual({
			organization,
			bestAvailableFieldValues: expectedBest,
			allFieldValues,
		});
	});
});
