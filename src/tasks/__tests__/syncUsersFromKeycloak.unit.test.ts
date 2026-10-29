import { TinyPgError } from 'tinypg';
import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import {
	ForbiddenError,
	InternalValidationError,
	KeycloakAdminApiError,
	UnauthorizedError,
} from '../../errors';
import { stringToKeycloakId, TaskStatus, type UserSyncTask } from '../../types';
import { syncUsersFromKeycloak } from '../syncUsersFromKeycloak';
import {
	createServiceQueryAuditLog,
	deleteManyByMissingId,
	insertOrUpdateMany,
	loadUserSyncTask,
	updateUserSyncTask,
} from '../../database';
import { fetchKeycloakUsers } from '../../keycloak';
import type { KeycloakUserRepresentation } from '../../keycloak';

jest.mock('../../database/db', () => ({
	getDatabase: jest.fn(() => mockDatabase),
}));
jest.mock('../../database', () => ({
	createServiceQueryAuditLog: jest.fn(),
	deleteManyByMissingId: jest.fn(),
	insertOrUpdateMany: jest.fn(),
	loadUserSyncTask: jest.fn(),
	updateUserSyncTask: jest.fn(),
}));
jest.mock('../../keycloak', () => ({
	fetchKeycloakUsers: jest.fn(),
}));

const mockedCreateServiceQueryAuditLog = jest.mocked(
	createServiceQueryAuditLog,
);
const mockedDeleteManyByMissingId = jest.mocked(deleteManyByMissingId);
const mockedFetchKeycloakUsers = jest.mocked(fetchKeycloakUsers);
const mockedInsertOrUpdateMany = jest.mocked(insertOrUpdateMany);
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

const greta: KeycloakUserRepresentation = {
	id: stringToKeycloakId('22222222-3333-4222-8222-222222222222'),
	firstName: 'Greta',
	lastName: null,
	enabled: true,
};

const hikari: KeycloakUserRepresentation = {
	id: stringToKeycloakId('55555555-6666-4333-8333-555555555555'),
	firstName: 'Hikari',
	lastName: null,
	enabled: true,
};

const pages = (...batches: KeycloakUserRepresentation[][]) =>
	mockedFetchKeycloakUsers.mockImplementation(
		// eslint-disable-next-line @typescript-eslint/require-await -- a mock cannot await
		async function* () {
			for (const batch of batches) {
				yield {
					users: batch,
					receivedAt: new Date('2666-06-06T06:06:06.666Z'),
				};
			}
		},
	);

const failingPages = (error: Error) =>
	mockedFetchKeycloakUsers.mockImplementation(
		// eslint-disable-next-line @typescript-eslint/require-await, require-yield -- a failing mock cannot await
		async function* () {
			throw error;
		},
	);

describe('syncUsersFromKeycloak task', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedLoadUserSyncTask.mockResolvedValue(pendingUserSyncTask);
		mockedUpdateUserSyncTask.mockResolvedValue(pendingUserSyncTask);
		mockedInsertOrUpdateMany.mockResolvedValue([{ wasInserted: false }]);
		mockedDeleteManyByMissingId.mockResolvedValue([]);
		pages([greta]);
	});

	it('completes the task with the listing summary', async () => {
		await expect(
			syncUsersFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();

		const expectedListing = [{ id: greta.id, name: 'Greta', enabled: true }];
		expect(mockedInsertOrUpdateMany).toHaveBeenCalledWith(
			expect.anything(),
			expectedListing,
			expect.any(String),
			expect.any(String),
		);
		expect(mockedCreateServiceQueryAuditLog).toHaveBeenCalledWith(
			expect.anything(),
			null,
			{
				queryName: 'users.syncFromKeycloak',
				queryParameters: {
					users: { seen: 1, added: 0, updated: 1, disabled: 0 },
				},
			},
		);
		expect(mockedUpdateUserSyncTask).toHaveBeenLastCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({
				status: TaskStatus.COMPLETED,
				details: { users: { seen: 1, added: 0, updated: 1, disabled: 0 } },
			}),
			13,
		);
	});

	it('counts inserted and disabled rows in the summary', async () => {
		pages([greta, { ...hikari, enabled: false }]);
		mockedInsertOrUpdateMany.mockResolvedValue([
			{ wasInserted: true },
			{ wasInserted: false },
		]);
		mockedDeleteManyByMissingId.mockResolvedValue([
			{ keycloak_user_id: '44444444-5555-4333-8333-444444444444' },
		]);

		await expect(
			syncUsersFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();

		expect(mockedDeleteManyByMissingId).toHaveBeenCalledWith(
			expect.anything(),
			['22222222-3333-4222-8222-222222222222'],
			['2666-06-06T06:06:06.666Z'],
			'2666-06-06T06:06:06.666Z',
		);
		expect(mockedUpdateUserSyncTask).toHaveBeenLastCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({
				details: { users: { seen: 2, added: 1, updated: 1, disabled: 2 } },
			}),
			13,
		);
	});

	it('merges each page separately', async () => {
		pages([greta], [hikari]);

		await expect(
			syncUsersFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();

		expect(mockedInsertOrUpdateMany).toHaveBeenCalledTimes(2);
		expect(mockedInsertOrUpdateMany).toHaveBeenNthCalledWith(
			1,
			expect.anything(),
			[{ id: greta.id, name: 'Greta', enabled: true }],
			expect.any(String),
			expect.any(String),
		);
		expect(mockedInsertOrUpdateMany).toHaveBeenNthCalledWith(
			2,
			expect.anything(),
			[{ id: hikari.id, name: 'Hikari', enabled: true }],
			expect.any(String),
			expect.any(String),
		);
	});

	it('skips disabling when the listing is empty', async () => {
		pages();

		await expect(
			syncUsersFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();

		expect(mockedInsertOrUpdateMany).not.toHaveBeenCalled();
		expect(mockedDeleteManyByMissingId).not.toHaveBeenCalled();
		expect(mockedUpdateUserSyncTask).toHaveBeenLastCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({
				details: { users: { seen: 0, added: 0, updated: 0, disabled: 0 } },
			}),
			13,
		);
	});

	it.each<[string, Error]>([
		[
			'a Keycloak Admin API failure',
			new KeycloakAdminApiError('request failed'),
		],
		['unauthorized credentials', new UnauthorizedError('unauthorized')],
		['forbidden credentials', new ForbiddenError('forbidden')],
		[
			'a malformed listing',
			new InternalValidationError('malformed listing', []),
		],
	])(
		'marks the task FAILED for %s without throwing',
		async (_label, listingError) => {
			failingPages(listingError);

			await expect(
				syncUsersFromKeycloak(validPayload, getMockJobHelpers()),
			).resolves.toBeUndefined();

			expect(mockedInsertOrUpdateMany).not.toHaveBeenCalled();
			expect(mockedUpdateUserSyncTask).toHaveBeenCalledWith(
				expect.anything(),
				null,
				expect.objectContaining({ status: TaskStatus.FAILED }),
				13,
			);
		},
	);

	it('propagates unexpected database errors instead of proceeding', async () => {
		mockedInsertOrUpdateMany.mockRejectedValue(new TinyPgError('bad insert'));

		await expect(
			syncUsersFromKeycloak(validPayload, getMockJobHelpers()),
		).rejects.toThrow('bad insert');

		expect(mockedUpdateUserSyncTask).not.toHaveBeenCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({ status: TaskStatus.FAILED }),
			13,
		);
	});

	it('propagates a failure to mark the task FAILED rather than proceeding', async () => {
		failingPages(new KeycloakAdminApiError('request failed'));
		mockedUpdateUserSyncTask.mockRejectedValue(
			new TinyPgError('statement timeout'),
		);

		await expect(
			syncUsersFromKeycloak(validPayload, getMockJobHelpers()),
		).rejects.toThrow('statement timeout');
	});
});
