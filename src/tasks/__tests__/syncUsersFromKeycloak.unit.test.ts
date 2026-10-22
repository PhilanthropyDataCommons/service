import { TinyPgError } from 'tinypg';
import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import { stringToKeycloakId, TaskStatus, type UserSyncTask } from '../../types';
import { syncUsersFromKeycloak } from '../syncUsersFromKeycloak';
import { loadUserSyncTask, updateUserSyncTask } from '../../database';

jest.mock('../../database/db', () => ({
	getDatabase: jest.fn(() => mockDatabase),
}));
jest.mock('../../database', () => ({
	loadUserSyncTask: jest.fn(),
	updateUserSyncTask: jest.fn(),
}));

const mockedLoadUserSyncTask = jest.mocked(loadUserSyncTask);
const mockedUpdateUserSyncTask = jest.mocked(updateUserSyncTask);
const mockDatabase = { sql: jest.fn() };

const pendingUserSyncTask: UserSyncTask = {
	id: 13,
	status: TaskStatus.PENDING,
	statusUpdatedAt: '2666-06-06T06:06:06.666Z',
	details: null,
	createdAt: '2666-06-06T06:06:06.666Z',
	createdBy: stringToKeycloakId('33333333-4444-4333-8333-333333333333'),
};

const validPayload = {
	userSyncTaskId: 13,
	keycloakAdminAuthorizationHeader: 'Bearer some.test.jwt',
};

describe('syncUsersFromKeycloak hello-world task', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockDatabase.sql.mockResolvedValue({ rows: [] });
		mockedLoadUserSyncTask.mockResolvedValue(pendingUserSyncTask);
		mockedUpdateUserSyncTask.mockResolvedValue(pendingUserSyncTask);
	});

	it('walks a pending task to completion without contacting Keycloak', async () => {
		await expect(
			syncUsersFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();

		expect(mockedUpdateUserSyncTask).toHaveBeenCalledTimes(2);
		expect(mockedUpdateUserSyncTask).toHaveBeenCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({ status: TaskStatus.IN_PROGRESS }),
			13,
		);
		expect(mockedUpdateUserSyncTask).toHaveBeenLastCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({ status: TaskStatus.COMPLETED }),
			13,
		);
	});

	it('ignores a malformed job payload', async () => {
		await expect(
			syncUsersFromKeycloak(
				{ keycloakAdminAuthorizationHeader: 'Bearer some.test.jwt' },
				getMockJobHelpers(),
			),
		).resolves.toBeUndefined();

		expect(mockedLoadUserSyncTask).not.toHaveBeenCalled();
		expect(mockedUpdateUserSyncTask).not.toHaveBeenCalled();
	});

	it('leaves a task alone when the task is not pending', async () => {
		mockedLoadUserSyncTask.mockResolvedValue({
			...pendingUserSyncTask,
			status: TaskStatus.COMPLETED,
		});

		await expect(
			syncUsersFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();

		expect(mockedUpdateUserSyncTask).not.toHaveBeenCalled();
	});

	it('tolerates database failures from the maintenance steps and proceeds', async () => {
		mockDatabase.sql.mockRejectedValue(
			new TinyPgError('connection lost', undefined, {
				error: { code: '08003' },
			}),
		);

		await expect(
			syncUsersFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();

		expect(mockedUpdateUserSyncTask).toHaveBeenLastCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({ status: TaskStatus.COMPLETED }),
			13,
		);
	});

	it('propagates unexpected maintenance failures instead of proceeding', async () => {
		mockDatabase.sql.mockRejectedValueOnce(new Error('disk full'));

		await expect(
			syncUsersFromKeycloak(validPayload, getMockJobHelpers()),
		).rejects.toThrow('disk full');

		expect(mockedUpdateUserSyncTask).not.toHaveBeenCalled();
	});
});
