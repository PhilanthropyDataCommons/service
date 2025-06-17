import nock from 'nock';
import { fetchBaseFieldsFromRemote, copyBaseFields } from '../index';
import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import {
	db,
	loadBaseFieldsCopyTask,
	createBaseFieldsCopyTask,
	loadSystemUser,
	loadTableMetrics,
	createOrUpdateBaseField,
	loadBaseField,
	createOrUpdateBaseFieldLocalization,
} from '../../database';
import {
	BaseFieldDataType,
	BaseFieldCategory,
	TaskStatus,
	BaseFieldSensitivityClassification,
} from '../../types';
import { expectTimestamp, getAuthContext } from '../../test/utils';
import type {
	BaseField,
	InternallyWritableBaseFieldsCopyTask,
	BaseFieldsCopyTask,
	AuthContext,
} from '../../types';

const MOCK_API_URL = 'https://example.com';

const createTestBaseFieldsCopyTask = async (
	authContext: AuthContext,
	overrideValues?: Partial<InternallyWritableBaseFieldsCopyTask>,
): Promise<BaseFieldsCopyTask> => {
	const defaultValues = {
		pdcApiUrl: MOCK_API_URL,
		status: TaskStatus.PENDING,
		statusUpdatedAt: new Date(Date.now()).toISOString(),
	};
	return createBaseFieldsCopyTask(db, authContext, {
		...defaultValues,
		...overrideValues,
	});
};

const mockFirstNameBaseField: BaseField = {
	label: 'First Name',
	description: 'The first name of the applicant',
	shortCode: 'first_name',
	localizations: {
		en: {
			baseFieldShortCode: 'first_name',
			language: 'en',
			label: 'First name',
			description: 'The first name of the Applicant',
			createdAt: '2024-10-17T01:46:58.494Z',
		},
		fr: {
			baseFieldShortCode: 'first_name',
			language: 'fr',
			label: 'Le Prenom',
			description: 'Le Prenom de la Applicant',
			createdAt: '2024-10-17T01:46:58.494Z',
		},
	},
	dataType: BaseFieldDataType.STRING,
	category: BaseFieldCategory.PROJECT,
	valueRelevanceHours: null,
	sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
	createdAt: '2024-10-17T01:46:58.494Z',
};

const mockFirstNameBaseFieldWithNoLocalizations: BaseField = {
	label: 'First Name',
	description: 'The first name of the applicant',
	shortCode: 'first_name',
	localizations: {},
	dataType: BaseFieldDataType.STRING,
	category: BaseFieldCategory.PROJECT,
	valueRelevanceHours: null,
	sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
	createdAt: '2024-10-17T01:46:58.494Z',
};

const mockLastNameBaseField: BaseField = {
	label: 'Last Name',
	description: 'The last name of the applicant',
	shortCode: 'last_name',
	localizations: {
		en: {
			baseFieldShortCode: 'last_name',
			language: 'en',
			label: 'Last name',
			description: 'The Last name of the Applicant',
			createdAt: '2024-10-17T01:46:58.494Z',
		},
		fr: {
			baseFieldShortCode: 'last_name',
			language: 'fr',
			label: 'Nom de famille',
			description: 'Le nom de la famille de la applicant',
			createdAt: '2024-10-17T01:46:58.494Z',
		},
	},
	dataType: BaseFieldDataType.STRING,
	category: BaseFieldCategory.PROJECT,
	valueRelevanceHours: null,
	sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
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
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask(
			systemUserAuthContext,
			{
				status: TaskStatus.IN_PROGRESS,
			},
		);
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, mockBaseFields);

		await copyBaseFields(
			{ BaseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			db,
			null,
			baseFieldsCopyTask.id,
		);

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.IN_PROGRESS);
		expect(request.isDone()).toEqual(false);
	});

	it('should fail if the remote url is unavailable', async () => {
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask(
			systemUserAuthContext,
			{
				status: TaskStatus.PENDING,
			},
		);
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(404, 'page not found');

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			db,
			null,
			baseFieldsCopyTask.id,
		);

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.FAILED);
		expect(request.isDone()).toEqual(true);
	});

	it('should fail if the remote url is available, but sends back invalid basefield data', async () => {
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask(
			systemUserAuthContext,
			{
				status: TaskStatus.PENDING,
			},
		);
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
			db,
			null,
			baseFieldsCopyTask.id,
		);

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.FAILED);
		expect(request.isDone()).toEqual(true);
	});

	it('should not insert any remote basefields if there are no basefields in the remote instance', async () => {
		const before = await loadTableMetrics('base_fields');

		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask(
			systemUserAuthContext,
			{
				status: TaskStatus.PENDING,
			},
		);
		const request = nock(MOCK_API_URL).get('/baseFields').reply(200, []);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			db,
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

		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask(
			systemUserAuthContext,
			{
				status: TaskStatus.PENDING,
			},
		);
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, [
				{
					...mockFirstNameBaseField,
					valueRelevanceHours: 9001,
				},
			]);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			db,
			null,
			baseFieldsCopyTask.id,
		);
		const after = await loadTableMetrics('base_fields');

		expect(before.count).toEqual(0);
		expect(after.count).toEqual(1);

		const insertedRemoteBaseField = await loadBaseField(
			db,
			null,
			mockFirstNameBaseField.shortCode,
		);

		expect(insertedRemoteBaseField).toEqual({
			label: 'First Name',
			description: 'The first name of the applicant',
			shortCode: mockFirstNameBaseField.shortCode,
			localizations: {
				en: {
					baseFieldShortCode: mockFirstNameBaseField.shortCode,
					language: 'en',
					label: 'First name',
					description: 'The first name of the Applicant',
					createdAt: expectTimestamp,
				},
				fr: {
					baseFieldShortCode: mockFirstNameBaseField.shortCode,
					language: 'fr',
					label: 'Le Prenom',
					description: 'Le Prenom de la Applicant',
					createdAt: expectTimestamp,
				},
			},
			dataType: 'string',
			category: 'project',
			valueRelevanceHours: 9001,
			sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
			createdAt: expectTimestamp,
		});

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});

	it('should insert all remote basefields, without updating any local basefields, assuming there is no overlap on shortcode', async () => {
		const localBaseField = await createOrUpdateBaseField(db, null, {
			label: 'Local BaseField',
			description: 'This basefield should not be updated on basefield copy',
			shortCode: 'local',
			dataType: BaseFieldDataType.STRING,
			category: BaseFieldCategory.PROJECT,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
		});

		const before = await loadTableMetrics('base_fields');

		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask(
			systemUserAuthContext,
			{
				status: TaskStatus.PENDING,
			},
		);
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, mockBaseFields);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			db,
			null,
			baseFieldsCopyTask.id,
		);
		const after = await loadTableMetrics('base_fields');

		expect(before.count).toEqual(1);
		expect(after.count).toEqual(3);

		const localBaseFieldAfterInsertion = await loadBaseField(
			db,
			null,
			localBaseField.shortCode,
		);

		expect(localBaseFieldAfterInsertion).toEqual(localBaseField);

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});

	it('should update local basefields when they match on remote basefield shortcodes, even if the basefields have identical data', async () => {
		const localBaseField = await createOrUpdateBaseField(db, null, {
			label: 'Local Data',
			description: 'This is local data',
			shortCode: 'ld',
			dataType: BaseFieldDataType.STRING,
			category: BaseFieldCategory.PROJECT,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
		});

		const mockRemoteBaseField: BaseField = {
			label: 'Local Data',
			description: 'This is local data',
			shortCode: 'ld',
			localizations: {},
			createdAt: '2024-10-17T01:46:58.494Z',
			dataType: BaseFieldDataType.STRING,
			category: BaseFieldCategory.PROJECT,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
		};

		const before = await loadTableMetrics('base_fields');

		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask(
			systemUserAuthContext,
			{
				status: TaskStatus.PENDING,
			},
		);
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, [mockRemoteBaseField]);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			db,
			null,
			baseFieldsCopyTask.id,
		);

		const after = await loadTableMetrics('base_fields');

		const updatedBaseField = await loadBaseField(
			db,
			null,
			localBaseField.shortCode,
		);

		expect(before.count).toEqual(1);
		expect(after.count).toEqual(1);

		expect(updatedBaseField).toEqual({
			label: 'Local Data',
			description: 'This is local data',
			shortCode: localBaseField.shortCode,
			dataType: 'string',
			category: 'project',
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
			createdAt: localBaseField.createdAt,
			localizations: {},
		});

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});

	it('should update local basefields when they match on remote basefield shortcodes, and insert all other remote basefields', async () => {
		const localBaseField = await createOrUpdateBaseField(db, null, {
			label: 'Local Data',
			description: 'This is local data',
			shortCode: 'ld',
			dataType: BaseFieldDataType.STRING,
			category: BaseFieldCategory.PROJECT,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
		});

		const mockRemoteBaseField = {
			id: 1,
			label: 'Local Data',
			description: 'This is local data',
			shortCode: 'ld',
			localizations: {},
			createdAt: '2024-10-17T01:46:58.494Z',
			dataType: BaseFieldDataType.STRING,
			category: BaseFieldCategory.PROJECT,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
		};

		const before = await loadTableMetrics('base_fields');

		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask(
			systemUserAuthContext,
			{
				status: TaskStatus.PENDING,
			},
		);
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, [mockRemoteBaseField, mockFirstNameBaseField]);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			db,
			null,
			baseFieldsCopyTask.id,
		);

		const after = await loadTableMetrics('base_fields');

		const updatedBaseField = await loadBaseField(
			db,
			null,
			localBaseField.shortCode,
		);

		expect(before.count).toEqual(1);
		expect(after.count).toEqual(2);

		expect(updatedBaseField).toEqual({
			label: 'Local Data',
			description: 'This is local data',
			shortCode: localBaseField.shortCode,
			dataType: 'string',
			category: 'project',
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
			createdAt: localBaseField.createdAt,
			localizations: {},
		});

		const insertedRemoteBaseField = await loadBaseField(
			db,
			null,
			mockFirstNameBaseField.shortCode,
		);

		expect(insertedRemoteBaseField).toEqual({
			label: 'First Name',
			description: 'The first name of the applicant',
			shortCode: mockFirstNameBaseField.shortCode,
			localizations: {
				en: {
					baseFieldShortCode: mockFirstNameBaseField.shortCode,
					language: 'en',
					label: 'First name',
					description: 'The first name of the Applicant',
					createdAt: expectTimestamp,
				},
				fr: {
					baseFieldShortCode: mockFirstNameBaseField.shortCode,
					language: 'fr',
					label: 'Le Prenom',
					description: 'Le Prenom de la Applicant',
					createdAt: expectTimestamp,
				},
			},
			dataType: 'string',
			category: 'project',
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
			createdAt: expectTimestamp,
		});

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});

	it('should preserve localizations for a local basefield with localizations, when there is a remote basefield with no localizations that matches on shortcode', async () => {
		const localBaseField = await createOrUpdateBaseField(db, null, {
			label: 'Update me',
			description: 'This is a field to be updated',
			shortCode: mockFirstNameBaseField.shortCode,
			dataType: BaseFieldDataType.STRING,
			category: BaseFieldCategory.PROJECT,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
		});

		await createOrUpdateBaseFieldLocalization(db, null, {
			baseFieldShortCode: localBaseField.shortCode,
			label: 'Le Prenom',
			description: 'Le Prenom de la Applicant',
			language: 'fr',
		});

		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, [mockFirstNameBaseFieldWithNoLocalizations]);

		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask(
			systemUserAuthContext,
			{
				status: TaskStatus.PENDING,
			},
		);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			db,
			null,
			baseFieldsCopyTask.id,
		);

		const updatedBaseField = await loadBaseField(
			db,
			null,
			localBaseField.shortCode,
		);

		expect(updatedBaseField).toEqual({
			label: 'First Name',
			description: 'The first name of the applicant',
			shortCode: mockFirstNameBaseField.shortCode,
			localizations: {
				fr: {
					baseFieldShortCode: localBaseField.shortCode,
					language: 'fr',
					label: 'Le Prenom',
					description: 'Le Prenom de la Applicant',
					createdAt: expectTimestamp,
				},
			},
			dataType: 'string',
			category: 'project',
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
			createdAt: localBaseField.createdAt,
		});

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});

	it('should add localizations to a local basefield from a remote basefield with matching shortcode', async () => {
		const localBaseField = await createOrUpdateBaseField(db, null, {
			label: 'Update me',
			description: 'This is a field to be updated',
			shortCode: mockFirstNameBaseField.shortCode,
			dataType: BaseFieldDataType.STRING,
			category: BaseFieldCategory.PROJECT,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
		});

		await createOrUpdateBaseFieldLocalization(db, null, {
			baseFieldShortCode: localBaseField.shortCode,
			label: 'Nombre de Pila',
			description: 'Nombre de Pila',
			language: 'sp',
		});

		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, [mockFirstNameBaseField]);

		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask(
			systemUserAuthContext,
			{
				status: TaskStatus.PENDING,
			},
		);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			db,
			null,
			baseFieldsCopyTask.id,
		);

		const updatedBaseField = await loadBaseField(
			db,
			null,
			localBaseField.shortCode,
		);

		expect(updatedBaseField).toEqual({
			label: 'First Name',
			description: 'The first name of the applicant',
			shortCode: mockFirstNameBaseField.shortCode,
			localizations: {
				en: {
					baseFieldShortCode: localBaseField.shortCode,
					language: 'en',
					label: 'First name',
					description: 'The first name of the Applicant',
					createdAt: expectTimestamp,
				},
				fr: {
					baseFieldShortCode: localBaseField.shortCode,
					language: 'fr',
					label: 'Le Prenom',
					description: 'Le Prenom de la Applicant',
					createdAt: expectTimestamp,
				},
				sp: {
					baseFieldShortCode: localBaseField.shortCode,
					label: 'Nombre de Pila',
					description: 'Nombre de Pila',
					language: 'sp',
					createdAt: expectTimestamp,
				},
			},
			dataType: 'string',
			category: 'project',
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
			createdAt: localBaseField.createdAt,
		});

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});

	it('should insert all valid remote basefields into the database, and have status set as completed', async () => {
		const before = await loadTableMetrics('base_fields');

		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask(
			systemUserAuthContext,
			{
				status: TaskStatus.PENDING,
			},
		);
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, mockBaseFields);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			db,
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
		const baseField = await createOrUpdateBaseField(db, null, {
			label: 'Old First Name',
			description: 'This should be replaced',
			shortCode: mockFirstNameBaseField.shortCode,
			dataType: BaseFieldDataType.STRING,
			category: BaseFieldCategory.PROJECT,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
		});

		const before = await loadTableMetrics('base_fields');

		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const baseFieldsCopyTask = await createTestBaseFieldsCopyTask(
			systemUserAuthContext,
			{
				status: TaskStatus.PENDING,
			},
		);
		const request = nock(MOCK_API_URL)
			.get('/baseFields')
			.reply(200, [mockFirstNameBaseField]);

		await copyBaseFields(
			{ baseFieldsCopyTaskId: baseFieldsCopyTask.id },
			getMockJobHelpers(),
		);

		const updatedBaseFieldsCopyTask = await loadBaseFieldsCopyTask(
			db,
			null,
			baseFieldsCopyTask.id,
		);

		const after = await loadTableMetrics('base_fields');

		const updatedBaseField = await loadBaseField(db, null, baseField.shortCode);

		expect(before.count).toEqual(1);
		expect(after.count).toEqual(1);

		expect(updatedBaseField).toEqual({
			label: 'First Name',
			description: 'The first name of the applicant',
			shortCode: baseField.shortCode,
			localizations: {
				en: {
					baseFieldShortCode: baseField.shortCode,
					language: 'en',
					label: 'First name',
					description: 'The first name of the Applicant',
					createdAt: expectTimestamp,
				},
				fr: {
					baseFieldShortCode: baseField.shortCode,
					language: 'fr',
					label: 'Le Prenom',
					description: 'Le Prenom de la Applicant',
					createdAt: expectTimestamp,
				},
			},
			dataType: 'string',
			category: 'project',
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
			createdAt: baseField.createdAt,
		});

		expect(updatedBaseFieldsCopyTask.status).toEqual(TaskStatus.COMPLETED);
		expect(request.isDone()).toEqual(true);
	});
});
