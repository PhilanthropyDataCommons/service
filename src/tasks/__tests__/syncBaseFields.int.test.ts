import { fetchBaseFieldsFromRemote, syncBaseFields } from '../syncBaseFields';
import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import {
	isSyncBaseFieldsJobPayload,
	BaseFieldDataType,
	BaseFieldScope,
} from '../../types';
import {
	loadBaseField,
	createBaseField,
	loadTableMetrics,
} from '../../database';
import { expectTimestamp } from '../../test/utils';

const createTestBaseFieldWithShortCode = async (shortCode: string) =>
	createBaseField({
		label: 'Label',
		description: 'Description',
		shortCode,
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.PROPOSAL,
	});

const testRemoteBaseFieldOne = {
	id: 175,
	label: 'Organization Name',
	scope: 'proposal',
	dataType: 'string',
	createdAt: '2023-03-21T15:23:21.994998+00:00',
	shortCode: 'organization_name',
	description: '',
	localizations: {
		en: {
			label: 'Organization Name',
			language: 'en',
			createdAt: '2024-09-09T19:56:37.71246+00:00',
			baseFieldId: 175,
			description: '',
		},
		zh: {
			label: '组织名称',
			language: 'zh',
			createdAt: '2024-09-17T15:28:08.17069+00:00',
			baseFieldId: 175,
			description: '组织的名称（参见「组织法定名称」）',
		},
	},
};

const testRemoteBaseFieldTwo = {
	id: 176,
	label: 'Organization Legal Name',
	scope: 'proposal',
	dataType: 'string',
	createdAt: '2023-03-21T15:23:21.994998+00:00',
	shortCode: 'organization_legal_name',
	description: '',
	localizations: {
		en: {
			label: 'Organization Legal Name',
			language: 'en',
			createdAt: '2024-09-09T19:56:37.71246+00:00',
			baseFieldId: 176,
			description: '',
		},
		zh: {
			label: 'Nom Legal de organization',
			language: 'fr',
			createdAt: '2024-09-17T15:28:08.17069+00:00',
			baseFieldId: 176,
			description: 'Le legal nom de organization',
		},
	},
};

const testRemoteBaseFieldsArray = [
	testRemoteBaseFieldOne,
	testRemoteBaseFieldTwo,
];

describe('fetchBaseFieldsFromRemote', () => {
	it('should retrieve all basefields from the remote pdc instance', async () => {
		const baseFields = await fetchBaseFieldsFromRemote();
		expect(isSyncBaseFieldsJobPayload({ baseFields })).toBe(true);
	});
});

describe('syncBaseFields', () => {
	it('should insert all remote basefields when there are no basefields present in the database', async () => {
		const before = await loadTableMetrics('base_fields');
		expect(before.count).toEqual(0);

		const helpers = getMockJobHelpers();
		await syncBaseFields({ baseFields: testRemoteBaseFieldsArray }, helpers);

		const after = await loadTableMetrics('base_fields');
		expect(after.count).toBe(2);
	});

	it('should insert all remote basefields when there are no basefields present in the database that match the remote shortcodes', async () => {
		await createTestBaseFieldWithShortCode('test_short_code');

		const before = await loadTableMetrics('base_fields');
		expect(before.count).toEqual(1);

		const helpers = getMockJobHelpers();
		await syncBaseFields({ baseFields: testRemoteBaseFieldsArray }, helpers);

		const after = await loadTableMetrics('base_fields');
		expect(after.count).toBe(3);
	});

	it('should insert all remote basefields that do not match any local basefield shortcodes, and update any local basefields on shortcode match', async () => {
		const testBaseField = await createTestBaseFieldWithShortCode(
			testRemoteBaseFieldOne.shortCode,
		);

		const before = await loadTableMetrics('base_fields');
		expect(before.count).toEqual(1);

		const helpers = getMockJobHelpers();
		await syncBaseFields({ baseFields: testRemoteBaseFieldsArray }, helpers);

		const after = await loadTableMetrics('base_fields');
		expect(after.count).toBe(2);

		const updatedBaseField = await loadBaseField(testBaseField.id);

		expect(updatedBaseField).toEqual(
			expect.objectContaining({
				description: testRemoteBaseFieldOne.description,
				label: testRemoteBaseFieldOne.label,
				dataType: testRemoteBaseFieldOne.dataType,
				scope: testRemoteBaseFieldOne.scope,
			}),
		);

		expect(updatedBaseField.localizations).toEqual({
			en: {
				label: 'Organization Name',
				language: 'en',
				baseFieldId: updatedBaseField.id,
				createdAt: expectTimestamp,
				description: '',
			},
			zh: {
				label: '组织名称',
				language: 'zh',
				baseFieldId: updatedBaseField.id,
				createdAt: expectTimestamp,
				description: '组织的名称（参见「组织法定名称」）',
			},
		});
	});
});
