import { TinyPgError } from 'tinypg';
import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import {
	ForbiddenError,
	InputConflictError,
	KeycloakAdminApiError,
	UnauthorizedError,
} from '../../errors';
import { stringToKeycloakId, TaskStatus, type UserSyncTask } from '../../types';
import { syncUsersFromKeycloak } from '../syncUsersFromKeycloak';
import {
	loadUserSyncTask,
	syncUsersFromKeycloak as syncUsersFromKeycloakOperation,
	updateUserSyncTask,
} from '../../database';

jest.mock('../../database/db', () => ({
	getDatabase: jest.fn(() => mockDatabase),
}));
jest.mock('../../database', () => ({
	loadUserSyncTask: jest.fn(),
	syncUsersFromKeycloak: jest.fn(),
	updateUserSyncTask: jest.fn(),
}));

const mockedLoadUserSyncTask = jest.mocked(loadUserSyncTask);
const mockedUpdateUserSyncTask = jest.mocked(updateUserSyncTask);
const mockedSyncUsersFromKeycloakOperation = jest.mocked(
	syncUsersFromKeycloakOperation,
);
const mockDatabase = { sql: jest.fn() };

const pendingUserSyncTask: UserSyncTask = {
	id: 7,
	status: TaskStatus.PENDING,
	statusUpdatedAt: '2666-06-06T06:06:06.666Z',
	details: null,
	createdAt: '2666-06-06T06:06:06.666Z',
	createdBy: stringToKeycloakId('77777777-8888-4777-8777-777777777777'),
};

describe('syncUsersFromKeycloak task failure handling', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockDatabase.sql.mockResolvedValue({ rows: [] });
		mockedLoadUserSyncTask.mockResolvedValue(pendingUserSyncTask);
		mockedUpdateUserSyncTask.mockResolvedValue(pendingUserSyncTask);
	});

	it.each<[string, Error]>([
		[
			'a concurrent sync conflict',
			new InputConflictError('locked', { entityType: 'UserSyncTask' }),
		],
		[
			'a Keycloak Admin API failure',
			new KeycloakAdminApiError('request failed'),
		],
		['unauthorized credentials', new UnauthorizedError('unauthorized')],
		['forbidden credentials', new ForbiddenError('forbidden')],
	])(
		'marks the task FAILED for %s without throwing',
		async (_label, operationError) => {
			mockedSyncUsersFromKeycloakOperation.mockRejectedValue(operationError);

			await expect(
				syncUsersFromKeycloak(
					{
						userSyncTaskId: 7,
						keycloakAdminAuthorizationHeader: 'Bearer token',
					},
					getMockJobHelpers(),
				),
			).resolves.toBeUndefined();

			expect(mockedUpdateUserSyncTask).toHaveBeenCalledWith(
				expect.anything(),
				null,
				expect.objectContaining({ status: TaskStatus.FAILED }),
				7,
			);
		},
	);

	it('propagates unexpected database errors instead of proceeding', async () => {
		mockedSyncUsersFromKeycloakOperation.mockRejectedValue(
			new TinyPgError('connection lost'),
		);

		await expect(
			syncUsersFromKeycloak(
				{
					userSyncTaskId: 7,
					keycloakAdminAuthorizationHeader: 'Bearer token',
				},
				getMockJobHelpers(),
			),
		).rejects.toThrow('connection lost');

		expect(mockedUpdateUserSyncTask).not.toHaveBeenCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({ status: TaskStatus.FAILED }),
			7,
		);
	});

	it('propagates a failure to mark the task FAILED rather than proceeding', async () => {
		mockedSyncUsersFromKeycloakOperation.mockRejectedValue(
			new KeycloakAdminApiError('request failed'),
		);
		mockedUpdateUserSyncTask.mockRejectedValue(
			new TinyPgError('statement timeout'),
		);

		await expect(
			syncUsersFromKeycloak(
				{
					userSyncTaskId: 7,
					keycloakAdminAuthorizationHeader: 'Bearer token',
				},
				getMockJobHelpers(),
			),
		).rejects.toThrow('statement timeout');
	});

	it('propagates unexpected maintenance failures instead of proceeding', async () => {
		mockDatabase.sql.mockRejectedValueOnce(new Error('disk full'));

		await expect(
			syncUsersFromKeycloak(
				{
					userSyncTaskId: 7,
					keycloakAdminAuthorizationHeader: 'Bearer token',
				},
				getMockJobHelpers(),
			),
		).rejects.toThrow('disk full');

		expect(mockedUpdateUserSyncTask).not.toHaveBeenCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({ status: TaskStatus.FAILED }),
			7,
		);
	});

	it('tolerates database failures from the maintenance steps and proceeds', async () => {
		mockDatabase.sql.mockRejectedValue(
			new TinyPgError('connection lost', undefined, {
				error: { code: '08003' },
			}),
		);
		mockedSyncUsersFromKeycloakOperation.mockResolvedValue({
			users: { seen: 7, added: 11, updated: 13, disabled: 17 },
		});

		await expect(
			syncUsersFromKeycloak(
				{
					userSyncTaskId: 7,
					keycloakAdminAuthorizationHeader: 'Bearer token',
				},
				getMockJobHelpers(),
			),
		).resolves.toBeUndefined();

		expect(mockedUpdateUserSyncTask).toHaveBeenCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({ status: TaskStatus.COMPLETED }),
			7,
		);
	});
});
