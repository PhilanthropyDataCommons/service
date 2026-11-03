import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import {
	stringToKeycloakId,
	TaskStatus,
	type OrganizationSyncTask,
} from '../../types';
import { syncOrganizationsFromKeycloak } from '../syncOrganizationsFromKeycloak';
import {
	loadOrganizationSyncTask,
	updateOrganizationSyncTask,
} from '../../database';

jest.mock('../../database/db', () => ({
	getDatabase: jest.fn(() => mockDatabase),
}));
jest.mock('../../database', () => ({
	loadOrganizationSyncTask: jest.fn(),
	updateOrganizationSyncTask: jest.fn(),
}));

const mockedLoadOrganizationSyncTask = jest.mocked(loadOrganizationSyncTask);
const mockedUpdateOrganizationSyncTask = jest.mocked(
	updateOrganizationSyncTask,
);
const mockDatabase = { sql: jest.fn() };

const pendingOrganizationSyncTask: OrganizationSyncTask = {
	id: 17,
	status: TaskStatus.PENDING,
	statusUpdatedAt: '2666-06-06T06:06:06.666Z',
	details: null,
	createdAt: '2666-06-06T06:06:06.666Z',
	createdBy: stringToKeycloakId('33333333-4444-4333-8333-333333333333'),
};

const validPayload = {
	organizationSyncTaskId: 17,
	keycloakAdminAuthorizationHeader: 'Bearer some.test.jwt',
};

describe('syncOrganizationsFromKeycloak hello-world task', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedLoadOrganizationSyncTask.mockResolvedValue(
			pendingOrganizationSyncTask,
		);
		mockedUpdateOrganizationSyncTask.mockResolvedValue(
			pendingOrganizationSyncTask,
		);
	});

	it('walks a pending task to completion without contacting Keycloak', async () => {
		await expect(
			syncOrganizationsFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();

		expect(mockedUpdateOrganizationSyncTask).toHaveBeenCalledTimes(2);
		expect(mockedUpdateOrganizationSyncTask).toHaveBeenCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({ status: TaskStatus.IN_PROGRESS }),
			17,
		);
		expect(mockedUpdateOrganizationSyncTask).toHaveBeenLastCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({ status: TaskStatus.COMPLETED }),
			17,
		);
	});

	it('ignores a malformed job payload', async () => {
		await expect(
			syncOrganizationsFromKeycloak(
				{ keycloakAdminAuthorizationHeader: 'Bearer some.test.jwt' },
				getMockJobHelpers(),
			),
		).resolves.toBeUndefined();

		expect(mockedLoadOrganizationSyncTask).not.toHaveBeenCalled();
		expect(mockedUpdateOrganizationSyncTask).not.toHaveBeenCalled();
	});

	it('leaves a task alone when the task is not pending', async () => {
		mockedLoadOrganizationSyncTask.mockResolvedValue({
			...pendingOrganizationSyncTask,
			status: TaskStatus.COMPLETED,
		});

		await expect(
			syncOrganizationsFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();

		expect(mockedUpdateOrganizationSyncTask).not.toHaveBeenCalled();
	});
});
