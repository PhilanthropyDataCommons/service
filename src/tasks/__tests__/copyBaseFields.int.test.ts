import nock from 'nock';
import { fetchBaseFieldsFromRemote, copyBaseFields } from '../index';
import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import {
	loadBaseFieldsCopyTask,
	createBaseFieldsCopyTask,
	loadSystemUser,
	loadTableMetrics,
	createOrUpdateBaseField,
	loadBaseField,
	createOrUpdateBaseFieldLocalization,
} from '../../database/operations';
import {
	InternallyWritableBaseFieldsCopyTask,
	BaseFieldsCopyTask,
	TaskStatus,
	BaseFieldDataType,
	BaseFieldScope,
} from '../../types';
import { expectTimestamp } from '../../test/utils';

const MOCK_API_URL = 'https://example.com';

const createTestBaseFieldsCopyTask = async (
	overrideValues?: Partial<InternallyWritableBaseFieldsCopyTask>,
): Promise<BaseFieldsCopyTask> => {
	const systemUser = await loadSystemUser(null);
	const defaultValues = {
		pdcApiUrl: MOCK_API_URL,
		status: TaskStatus.PENDING,
		statusUpdatedAt: new Date(Date.now()).toISOString(),
		createdBy: systemUser.keycloakUserId,
	};
	return createBaseFieldsCopyTask({
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
			label: 'Le Prenom',
			description: 'Le Prenom de la Applicant',
			createdAt: '2024-10-17T01:46:58.494Z',
		},
	},
	dataType: 'string',
	scope: 'proposal',
	createdAt: '2024-10-17T01:46:58.494Z',
};

const mockFirstNameBaseFieldWithNoLocalizations = {
	id: 1,
	label: 'First Name',
	description: 'The first name of the applicant',
	shortCode: 'first_name',
	localizations: {},
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
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.replyWithError('nobody here but us chickens');

		await expect(
			fetchBaseFieldsFromRemote(MOCK_API_URL, getMockJobHelpers().logger),
		).rejects.toThrow();

		expect(request.isDone()).toEqual(true);
	});

	it('should throw an error if the http request to the synchronization url succeeds, but the data recieved is not valid json', async () => {
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, 'nobody here but us chickens');

		await expect(
			fetchBaseFieldsFromRemote(MOCK_API_URL, getMockJobHelpers().logger),
		).rejects.toThrow();

		expect(request.isDone()).toEqual(true);
	});

	it('should throw an error if the http request to the synchronization url succeeds, provides valid json, but the json is not an array of basefields', async () => {
		const request = nock(MOCK_API_URL)
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
			fetchBaseFieldsFromRemote(MOCK_API_URL, getMockJobHelpers().logger),
		).rejects.toThrow();

		expect(request.isDone()).toEqual(true);
	});

	it('should resolve a valid response', async () => {
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, mockBaseFields);

		await expect(
			fetchBaseFieldsFromRemote(MOCK_API_URL, getMockJobHelpers().logger),
		).resolves.toEqual(mockBaseFields);

		expect(request.isDone()).toEqual(true);
	});
});

describe('copyBaseFields', () => {
	beforeEach(() => {
		nock.cleanAll();
	});

	it('should not process or modify processing status if the task is not PENDING', async () => {
		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask({
			status: TaskStatus.IN_PROGRESS,
		});
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, mockBaseFields);

		await copyBaseFields(
			{ BaseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			null,
			baseFieldsCopyTask.id,
		);

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.IN_PROGRESS);
		expect(request.isDone()).toEqual(false);
	});

	it('should fail if the remote url is unavailable', async () => {
		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask({
			status: TaskStatus.PENDING,
		});
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(404, 'page not found');

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			null,
			baseFieldsCopyTask.id,
		);

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.FAILED);
		expect(request.isDone()).toEqual(true);
	});

	it('should fail if the remote url is available, but sends back invalid basefield data', async () => {
		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask({
			status: TaskStatus.PENDING,
		});
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, [
				{
					hello: 'how ya doing',
					may: 'i be inserted into your database?',
					pretty: 'please?',
					imjust: 'a friendly piece of data, believe me',
				},
			]);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			null,
			baseFieldsCopyTask.id,
		);

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.FAILED);
		expect(request.isDone()).toEqual(true);
	});

	it('should not insert any remote basefields if there are no basefields in the remote instance', async () => {
		const before = await loadTableMetrics('base_fields');

		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask({
			status: TaskStatus.PENDING,
		});
		const request = nock(MOCK_API_URL).get('/baseFields').reply(200, []);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			null,
			baseFieldsCopyTask.id,
		);
		const after = await loadTableMetrics('base_fields');

		expect(before.count).toEqual(0);
		expect(after.count).toEqual(0);

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});

	it('should insert all remote basefields to an empty local database', async () => {
		const before = await loadTableMetrics('base_fields');

		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask({
			status: TaskStatus.PENDING,
		});
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, [mockFirstNameBaseField]);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			null,
			baseFieldsCopyTask.id,
		);
		const after = await loadTableMetrics('base_fields');

		expect(before.count).toEqual(0);
		expect(after.count).toEqual(1);

		const insertedRemoteBaseField = await loadBaseField(null, 1);

		expect(insertedRemoteBaseField).toEqual({
			id: 1,
			label: 'First Name',
			description: 'The first name of the applicant',
			shortCode: mockFirstNameBaseField.shortCode,
			localizations: {
				en: {
					baseFieldId: 1,
					language: 'en',
					label: 'First name',
					description: 'The first name of the Applicant',
					createdAt: expectTimestamp,
				},
				fr: {
					baseFieldId: 1,
					language: 'fr',
					label: 'Le Prenom',
					description: 'Le Prenom de la Applicant',
					createdAt: expectTimestamp,
				},
			},
			dataType: 'string',
			scope: 'proposal',
			createdAt: expectTimestamp,
		});

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});

	it('should insert all remote basefields, without updating any local basefields, assuming there is no overlap on shortcode', async () => {
		const localBaseField = await createOrUpdateBaseField({
			label: 'Local BaseField',
			description: 'This basefield should not be updated on basefield copy',
			shortCode: 'local',
			dataType: BaseFieldDataType.STRING,
			scope: BaseFieldScope.PROPOSAL,
		});

		const before = await loadTableMetrics('base_fields');

		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask({
			status: TaskStatus.PENDING,
		});
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, mockBaseFields);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			null,
			baseFieldsCopyTask.id,
		);
		const after = await loadTableMetrics('base_fields');

		expect(before.count).toEqual(1);
		expect(after.count).toEqual(3);

		const localBaseFieldAfterInsertion = await loadBaseField(
			null,
			localBaseField.id,
		);

		expect(localBaseFieldAfterInsertion).toEqual(localBaseField);

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});

	it('should update local basefields when they match on remote basefield shortcodes, even if the basefields have identical data', async () => {
		const localBaseField = await createOrUpdateBaseField({
			label: 'Local Data',
			description: 'This is local data',
			shortCode: 'ld',
			dataType: BaseFieldDataType.STRING,
			scope: BaseFieldScope.PROPOSAL,
		});

		const mockRemoteBaseField = {
			id: 1,
			label: 'Local Data',
			description: 'This is local data',
			shortCode: 'ld',
			localizations: {},
			createdAt: '2024-10-17T01:46:58.494Z',
			dataType: BaseFieldDataType.STRING,
			scope: BaseFieldScope.PROPOSAL,
		};

		const before = await loadTableMetrics('base_fields');

		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask({
			status: TaskStatus.PENDING,
		});
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, [mockRemoteBaseField]);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			null,
			baseFieldsCopyTask.id,
		);

		const after = await loadTableMetrics('base_fields');

		const updatedBaseField = await loadBaseField(null, localBaseField.id);

		expect(before.count).toEqual(1);
		expect(after.count).toEqual(1);

		expect(updatedBaseField).toEqual({
			id: localBaseField.id,
			label: 'Local Data',
			description: 'This is local data',
			shortCode: 'ld',
			dataType: 'string',
			scope: 'proposal',
			createdAt: localBaseField.createdAt,
			localizations: {},
		});

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});

	it('should update local basefields when they match on remote basefield shortcodes, and insert all other remote basefields', async () => {
		const localBaseField = await createOrUpdateBaseField({
			label: 'Local Data',
			description: 'This is local data',
			shortCode: 'ld',
			dataType: BaseFieldDataType.STRING,
			scope: BaseFieldScope.PROPOSAL,
		});

		const mockRemoteBaseField = {
			id: 1,
			label: 'Local Data',
			description: 'This is local data',
			shortCode: 'ld',
			localizations: {},
			createdAt: '2024-10-17T01:46:58.494Z',
			dataType: BaseFieldDataType.STRING,
			scope: BaseFieldScope.PROPOSAL,
		};

		const before = await loadTableMetrics('base_fields');

		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask({
			status: TaskStatus.PENDING,
		});
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, [mockRemoteBaseField, mockFirstNameBaseField]);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			null,
			baseFieldsCopyTask.id,
		);

		const after = await loadTableMetrics('base_fields');

		const updatedBaseField = await loadBaseField(null, localBaseField.id);

		expect(before.count).toEqual(1);
		expect(after.count).toEqual(2);

		expect(updatedBaseField).toEqual({
			id: localBaseField.id,
			label: 'Local Data',
			description: 'This is local data',
			shortCode: 'ld',
			dataType: 'string',
			scope: 'proposal',
			createdAt: localBaseField.createdAt,
			localizations: {},
		});

		const insertedRemoteBaseField = await loadBaseField(null, 3);

		expect(insertedRemoteBaseField).toEqual({
			id: 3,
			label: 'First Name',
			description: 'The first name of the applicant',
			shortCode: mockFirstNameBaseField.shortCode,
			localizations: {
				en: {
					baseFieldId: 3,
					language: 'en',
					label: 'First name',
					description: 'The first name of the Applicant',
					createdAt: expectTimestamp,
				},
				fr: {
					baseFieldId: 3,
					language: 'fr',
					label: 'Le Prenom',
					description: 'Le Prenom de la Applicant',
					createdAt: expectTimestamp,
				},
			},
			dataType: 'string',
			scope: 'proposal',
			createdAt: expectTimestamp,
		});

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});

	it('should preserve localizations for a local basefield with localizations, when there is a remote basefield with no localizations that matches on shortcode', async () => {
		const localBaseField = await createOrUpdateBaseField({
			label: 'Update me',
			description: 'This is a field to be updated',
			shortCode: mockFirstNameBaseField.shortCode,
			dataType: BaseFieldDataType.STRING,
			scope: BaseFieldScope.PROPOSAL,
		});

		await createOrUpdateBaseFieldLocalization({
			baseFieldId: localBaseField.id,
			label: 'Le Prenom',
			description: 'Le Prenom de la Applicant',
			language: 'fr',
		});

		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, [mockFirstNameBaseFieldWithNoLocalizations]);

		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask({
			status: TaskStatus.PENDING,
		});

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			null,
			baseFieldsCopyTask.id,
		);

		const updatedBaseField = await loadBaseField(null, localBaseField.id);

		expect(updatedBaseField).toEqual({
			id: localBaseField.id,
			label: 'First Name',
			description: 'The first name of the applicant',
			shortCode: mockFirstNameBaseField.shortCode,
			localizations: {
				fr: {
					baseFieldId: localBaseField.id,
					language: 'fr',
					label: 'Le Prenom',
					description: 'Le Prenom de la Applicant',
					createdAt: expectTimestamp,
				},
			},
			dataType: 'string',
			scope: 'proposal',
			createdAt: localBaseField.createdAt,
		});

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});

	it('should add localizations to a local basefield from a remote basefield with matching shortcode', async () => {
		const localBaseField = await createOrUpdateBaseField({
			label: 'Update me',
			description: 'This is a field to be updated',
			shortCode: mockFirstNameBaseField.shortCode,
			dataType: BaseFieldDataType.STRING,
			scope: BaseFieldScope.PROPOSAL,
		});

		await createOrUpdateBaseFieldLocalization({
			baseFieldId: localBaseField.id,
			label: 'Nombre de Pila',
			description: 'Nombre de Pila',
			language: 'sp',
		});

		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, [mockFirstNameBaseField]);

		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask({
			status: TaskStatus.PENDING,
		});

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			null,
			baseFieldsCopyTask.id,
		);

		const updatedBaseField = await loadBaseField(null, localBaseField.id);

		expect(updatedBaseField).toEqual({
			id: localBaseField.id,
			label: 'First Name',
			description: 'The first name of the applicant',
			shortCode: mockFirstNameBaseField.shortCode,
			localizations: {
				en: {
					baseFieldId: localBaseField.id,
					language: 'en',
					label: 'First name',
					description: 'The first name of the Applicant',
					createdAt: expectTimestamp,
				},
				fr: {
					baseFieldId: localBaseField.id,
					language: 'fr',
					label: 'Le Prenom',
					description: 'Le Prenom de la Applicant',
					createdAt: expectTimestamp,
				},
				sp: {
					baseFieldId: localBaseField.id,
					label: 'Nombre de Pila',
					description: 'Nombre de Pila',
					language: 'sp',
					createdAt: expectTimestamp,
				},
			},
			dataType: 'string',
			scope: 'proposal',
			createdAt: localBaseField.createdAt,
		});

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});

	it('should insert all valid remote basefields into the database, and have status set as completed', async () => {
		const before = await loadTableMetrics('base_fields');

		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask({
			status: TaskStatus.PENDING,
		});
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, mockBaseFields);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			null,
			baseFieldsCopyTask.id,
		);
		const after = await loadTableMetrics('base_fields');

		expect(before.count).toEqual(0);
		expect(after.count).toEqual(2);

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});

	it('should update any existing local basefields that match on shortcode, and have status set as completed', async () => {
		const baseField = await createOrUpdateBaseField({
			label: 'Old First Name',
			description: 'This should be replaced',
			shortCode: mockFirstNameBaseField.shortCode,
			dataType: BaseFieldDataType.STRING,
			scope: BaseFieldScope.PROPOSAL,
		});

		const before = await loadTableMetrics('base_fields');

		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask({
			status: TaskStatus.PENDING,
		});
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, [mockFirstNameBaseField]);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			null,
			baseFieldsCopyTask.id,
		);

		const after = await loadTableMetrics('base_fields');

		const updatedBaseField = await loadBaseField(null, baseField.id);

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
					label: 'Le Prenom',
					description: 'Le Prenom de la Applicant',
					createdAt: expectTimestamp,
				},
			},
			dataType: 'string',
			scope: 'proposal',
			createdAt: baseField.createdAt,
		});

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});
});
