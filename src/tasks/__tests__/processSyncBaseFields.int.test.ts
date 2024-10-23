import nock from 'nock';
import {
	fetchBaseFieldsFromRemote,
	processSyncBaseFields,
} from '../processSyncBaseFields';
import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import {
	loadSyncBaseField,
	createSyncBaseField,
	loadSystemUser,
	loadTableMetrics,
	createBaseField,
	loadBaseField,
} from '../../database/operations';
import {
	InternallyWritableSyncBaseField,
	SyncBaseField,
	SyncBasefieldStatus,
	BaseFieldDataType,
	BaseFieldScope,
} from '../../types';
import { expectTimestamp } from '../../test/utils';

const MOCK_SYNCHRONIZATION_URL = 'https://remote.pdc.instance.com';

const createTestSyncBaseField = async (
	overrideValues?: Partial<InternallyWritableSyncBaseField>,
): Promise<SyncBaseField> => {
	const systemUser = await loadSystemUser();
	const defaultValues = {
		synchronizationUrl: MOCK_SYNCHRONIZATION_URL,
		status: SyncBasefieldStatus.PENDING,
		statusUpdatedAt: new Date(Date.now()).toISOString(),
		createdBy: systemUser.keycloakUserId,
	};
	return createSyncBaseField({
		...defaultValues,
		...overrideValues,
	});
};

const mockFirstNameBaseField = {
	id: 1,
	label: 'First Name',
	description: 'The first name of the applicant',
	shortCode: 'first_name',
	localizations: {
		en: {
			baseFieldId: 1,
			language: 'en',
			label: 'First name',
			description: 'The first name of the Applicant',
			createdAt: '2024-10-17T01:46:58.494Z',
		},
		fr: {
			baseFieldId: 1,
			language: 'fr',
			label: 'Prenom',
			description: 'Le prenom de la applicant',
			createdAt: '2024-10-17T01:46:58.494Z',
		},
	},
	dataType: 'string',
	scope: 'proposal',
	createdAt: '2024-10-17T01:46:58.494Z',
};

const mockLastNameBaseField = {
	id: 2,
	label: 'Last Name',
	description: 'The last name of the applicant',
	shortCode: 'last_name',
	localizations: {
		en: {
			baseFieldId: 2,
			language: 'en',
			label: 'Last name',
			description: 'The Last name of the Applicant',
			createdAt: '2024-10-17T01:46:58.494Z',
		},
		fr: {
			baseFieldId: 2,
			language: 'fr',
			label: 'Nom de famille',
			description: 'Le nom de la famille de la applicant',
			createdAt: '2024-10-17T01:46:58.494Z',
		},
	},
	dataType: 'string',
	scope: 'proposal',
	createdAt: '2024-10-17T01:46:58.494Z',
};

const mockBaseFields = [mockFirstNameBaseField, mockLastNameBaseField];

describe('fetchBaseFieldsFromRemote', () => {
	beforeEach(() => {
		nock.cleanAll();
	});

	it('should throw an error if the http request to the synchronization url fails', async () => {
		const request = nock(MOCK_SYNCHRONIZATION_URL)
			.get('/baseFields')
			.replyWithError('nobody here but us chickens');

		await expect(
			fetchBaseFieldsFromRemote(MOCK_SYNCHRONIZATION_URL),
		).rejects.toThrow();

		expect(request.isDone()).toEqual(true);
	});

	it('should throw an error if the http request to the synchronization url succeeds, but the data recieved is not valid json', async () => {
		const request = nock(MOCK_SYNCHRONIZATION_URL)
			.get('/baseFields')
			.reply(200, 'nobody here but us chickens');

		await expect(
			fetchBaseFieldsFromRemote(MOCK_SYNCHRONIZATION_URL),
		).rejects.toThrow();

		expect(request.isDone()).toEqual(true);
	});

	it('should throw an error if the http request to the synchronization url succeeds, provides valid json, but the json is not an array of basefields', async () => {
		const request = nock(MOCK_SYNCHRONIZATION_URL)
			.get('/baseFields')
			.reply(200, [
				{
					hello: 'how ya doing',
					may: 'i be inserted into your database?',
					pretty: 'please?',
					idont: 'have any escape sequences in me i swear',
				},
			]);

		await expect(
			fetchBaseFieldsFromRemote(MOCK_SYNCHRONIZATION_URL),
		).rejects.toThrow();

		expect(request.isDone()).toEqual(true);
	});

	it('should resolve a valid response', async () => {
		const request = nock(MOCK_SYNCHRONIZATION_URL)
			.get('/baseFields')
			.reply(200, mockBaseFields);

		await expect(
			fetchBaseFieldsFromRemote(MOCK_SYNCHRONIZATION_URL),
		).resolves.toEqual(mockBaseFields);

		expect(request.isDone()).toEqual(true);
	});
});

describe('processSyncBaseFields', () => {
	beforeEach(() => {
		nock.cleanAll();
	});

	it('should not process or modify processing status if the bulk upload is not PENDING', async () => {
		const syncBaseField = await createTestSyncBaseField({
			status: SyncBasefieldStatus.IN_PROGRESS,
		});
		const request = nock(MOCK_SYNCHRONIZATION_URL)
			.get('/baseFields')
			.reply(200, mockBaseFields);

		await processSyncBaseFields(
			{ syncBaseFieldId: syncBaseField.id },
			getMockJobHelpers(),
		);

		const updatedSyncBaseField = await loadSyncBaseField(syncBaseField.id);

		expect(updatedSyncBaseField.status).toEqual(
			SyncBasefieldStatus.IN_PROGRESS,
		);
		expect(request.isDone()).toEqual(false);
	});

	it('should fail if the remote url is unavailable', async () => {
		const syncBaseField = await createTestSyncBaseField({
			status: SyncBasefieldStatus.PENDING,
		});
		const request = nock(MOCK_SYNCHRONIZATION_URL)
			.get('/baseFields')
			.reply(404, 'page not found');

		await processSyncBaseFields(
			{ syncBaseFieldId: syncBaseField.id },
			getMockJobHelpers(),
		);

		const updatedSyncBaseField = await loadSyncBaseField(syncBaseField.id);

		expect(updatedSyncBaseField.status).toEqual(SyncBasefieldStatus.FAILED);
		expect(request.isDone()).toEqual(true);
	});

	it('should fail if the remote url is available, but sends back invalid basefield data', async () => {
		const syncBaseField = await createTestSyncBaseField({
			status: SyncBasefieldStatus.PENDING,
		});
		const request = nock(MOCK_SYNCHRONIZATION_URL)
			.get('/baseFields')
			.reply(200, [
				{
					hello: 'how ya doing',
					may: 'i be inserted into your database?',
					pretty: 'please?',
					imjust: 'a friendly piece of data, believe me',
				},
			]);

		await processSyncBaseFields(
			{ syncBaseFieldId: syncBaseField.id },
			getMockJobHelpers(),
		);

		const updatedSyncBaseField = await loadSyncBaseField(syncBaseField.id);

		expect(updatedSyncBaseField.status).toEqual(SyncBasefieldStatus.FAILED);
		expect(request.isDone()).toEqual(true);
	});

	it('should insert all valid remote basefields into the database, and have status set as completed', async () => {
		const before = await loadTableMetrics('base_fields');

		const syncBaseField = await createTestSyncBaseField({
			status: SyncBasefieldStatus.PENDING,
		});
		const request = nock(MOCK_SYNCHRONIZATION_URL)
			.get('/baseFields')
			.reply(200, mockBaseFields);

		await processSyncBaseFields(
			{ syncBaseFieldId: syncBaseField.id },
			getMockJobHelpers(),
		);

		const updatedSyncBaseField = await loadSyncBaseField(syncBaseField.id);
		const after = await loadTableMetrics('base_fields');

		expect(before.count).toEqual(0);
		expect(after.count).toEqual(2);

		expect(updatedSyncBaseField.status).toEqual(SyncBasefieldStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});

	it('should update any existing local basefields that match on shortcode, and have status set as completed', async () => {
		const baseField = await createBaseField({
			label: 'Summary',
			description: 'A summary of the proposal',
			shortCode: mockFirstNameBaseField.shortCode,
			dataType: BaseFieldDataType.STRING,
			scope: BaseFieldScope.PROPOSAL,
		});

		const before = await loadTableMetrics('base_fields');

		const syncBaseField = await createTestSyncBaseField({
			status: SyncBasefieldStatus.PENDING,
		});
		const request = nock(MOCK_SYNCHRONIZATION_URL)
			.get('/baseFields')
			.reply(200, [mockFirstNameBaseField]);

		await processSyncBaseFields(
			{ syncBaseFieldId: syncBaseField.id },
			getMockJobHelpers(),
		);

		const updatedSyncBaseField = await loadSyncBaseField(syncBaseField.id);

		const after = await loadTableMetrics('base_fields');

		const updatedBaseField = await loadBaseField(baseField.id);

		expect(before.count).toEqual(1);
		expect(after.count).toEqual(1);

		expect(updatedBaseField).toEqual({
			id: baseField.id,
			label: 'First Name',
			description: 'The first name of the applicant',
			shortCode: 'first_name',
			localizations: {
				en: {
					baseFieldId: baseField.id,
					language: 'en',
					label: 'First name',
					description: 'The first name of the Applicant',
					createdAt: expectTimestamp,
				},
				fr: {
					baseFieldId: 1,
					language: 'fr',
					label: 'Prenom',
					description: 'Le prenom de la applicant',
					createdAt: expectTimestamp,
				},
			},
			dataType: 'string',
			scope: 'proposal',
			createdAt: baseField.createdAt,
		});

		expect(updatedSyncBaseField.status).toEqual(SyncBasefieldStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});
});
