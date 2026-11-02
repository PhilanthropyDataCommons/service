import { TinyPgError } from 'tinypg';
import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import {
	ForbiddenError,
	InternalValidationError,
	KeycloakAdminApiError,
	UnauthorizedError,
} from '../../errors';
import {
	stringToKeycloakId,
	TaskStatus,
	type OrganizationSyncTask,
} from '../../types';
import { syncOrganizationsFromKeycloak } from '../syncOrganizationsFromKeycloak';
import {
	createServiceQueryAuditLog,
	loadOrganizationSyncTask,
	updateOrganizationSyncTask,
} from '../../database';
import {
	disableManyLastSyncedBefore as disableOrganizationsLastSyncedBefore,
	insertOrUpdateMany as insertOrUpdateOrganizations,
} from '../../database/operations/organizations';
import {
	disableManyLastSyncedBefore,
	disableManyLastSyncedBeforeByOrganizationId,
	insertOrUpdateMany as insertOrUpdateOrganizationMemberships,
} from '../../database/operations/userOrganizationMemberships';
import { insertOrUpdateMany as insertOrUpdateUsers } from '../../database/operations/users';
import {
	fetchKeycloakOrganizationMembers,
	fetchKeycloakOrganizations,
} from '../../keycloak';
import type {
	KeycloakOrganizationMemberRepresentation,
	KeycloakOrganizationRepresentation,
} from '../../keycloak';

jest.mock('../../database/db', () => ({
	getDatabase: jest.fn(() => mockDatabase),
}));
jest.mock('../../database', () => ({
	createServiceQueryAuditLog: jest.fn(),
	loadOrganizationSyncTask: jest.fn(),
	updateOrganizationSyncTask: jest.fn(),
}));
jest.mock('../../database/operations/organizations', () => ({
	disableManyLastSyncedBefore: jest.fn(),
	insertOrUpdateMany: jest.fn(),
}));
jest.mock('../../database/operations/userOrganizationMemberships', () => ({
	disableManyLastSyncedBefore: jest.fn(),
	disableManyLastSyncedBeforeByOrganizationId: jest.fn(),
	insertOrUpdateMany: jest.fn(),
}));
jest.mock('../../database/operations/users', () => ({
	insertOrUpdateMany: jest.fn(),
}));
jest.mock('../../keycloak', () => ({
	fetchKeycloakOrganizationMembers: jest.fn(),
	fetchKeycloakOrganizations: jest.fn(),
}));

const mockedCreateServiceQueryAuditLog = jest.mocked(
	createServiceQueryAuditLog,
);
const mockedDisableOrganizationsLastSyncedBefore = jest.mocked(
	disableOrganizationsLastSyncedBefore,
);
const mockedDisableManyLastSyncedBefore = jest.mocked(
	disableManyLastSyncedBefore,
);
const mockedFetchKeycloakOrganizations = jest.mocked(
	fetchKeycloakOrganizations,
);
const mockedFetchKeycloakOrganizationMembers = jest.mocked(
	fetchKeycloakOrganizationMembers,
);
const mockedInsertOrUpdateOrganizations = jest.mocked(
	insertOrUpdateOrganizations,
);
const mockedInsertOrUpdateOrganizationMemberships = jest.mocked(
	insertOrUpdateOrganizationMemberships,
);
const mockedInsertOrUpdateUsers = jest.mocked(insertOrUpdateUsers);
const mockedDisableManyLastSyncedBeforeByOrganizationId = jest.mocked(
	disableManyLastSyncedBeforeByOrganizationId,
);
const mockedLoadOrganizationSyncTask = jest.mocked(loadOrganizationSyncTask);
const mockedUpdateOrganizationSyncTask = jest.mocked(
	updateOrganizationSyncTask,
);
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

const RECEIVED_AT = new Date('2666-06-06T06:06:06.666Z');

const funderdome: KeycloakOrganizationRepresentation = {
	id: stringToKeycloakId('22222222-3333-4222-8222-222222222222'),
	name: 'Funderdome',
	enabled: true,
};

const greta: KeycloakOrganizationMemberRepresentation = {
	id: stringToKeycloakId('11111111-2222-4111-8111-111111111111'),
	firstName: 'Greta',
	lastName: null,
	enabled: true,
};

const hikari: KeycloakOrganizationMemberRepresentation = {
	id: stringToKeycloakId('44444444-5555-4333-8333-444444444444'),
	firstName: 'Hikari',
	lastName: null,
	enabled: true,
};

const organizationPages = (
	...batches: KeycloakOrganizationRepresentation[][]
) =>
	mockedFetchKeycloakOrganizations.mockImplementation(
		// eslint-disable-next-line @typescript-eslint/require-await -- a mock cannot await
		async function* () {
			for (const batch of batches) {
				yield { organizations: batch, receivedAt: RECEIVED_AT };
			}
		},
	);

const memberPages = (
	...batches: KeycloakOrganizationMemberRepresentation[][]
) =>
	mockedFetchKeycloakOrganizationMembers.mockImplementation(
		// eslint-disable-next-line @typescript-eslint/require-await -- a mock cannot await
		async function* () {
			for (const batch of batches) {
				yield { members: batch, receivedAt: RECEIVED_AT };
			}
		},
	);

const failingOrganizationPages = (error: Error) =>
	mockedFetchKeycloakOrganizations.mockImplementation(
		// eslint-disable-next-line @typescript-eslint/require-await, require-yield -- a failing mock cannot await
		async function* () {
			throw error;
		},
	);

describe('syncOrganizationsFromKeycloak task', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedLoadOrganizationSyncTask.mockResolvedValue(
			pendingOrganizationSyncTask,
		);
		mockedUpdateOrganizationSyncTask.mockResolvedValue(
			pendingOrganizationSyncTask,
		);
		mockedInsertOrUpdateOrganizations.mockResolvedValue([
			{ wasInserted: false },
		]);
		mockedInsertOrUpdateOrganizationMemberships.mockResolvedValue([
			{ wasInserted: false },
		]);
		mockedInsertOrUpdateUsers.mockResolvedValue([{ wasInserted: false }]);
		mockedDisableOrganizationsLastSyncedBefore.mockResolvedValue([]);
		mockedDisableManyLastSyncedBefore.mockResolvedValue([]);
		mockedDisableManyLastSyncedBeforeByOrganizationId.mockResolvedValue([]);
		organizationPages([funderdome]);
		memberPages([greta]);
	});
	it('completes the task with the organization and membership summary', async () => {
		await expect(
			syncOrganizationsFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();

		expect(mockedInsertOrUpdateOrganizations).toHaveBeenCalledWith(
			expect.anything(),
			[{ id: funderdome.id, name: 'Funderdome', enabled: true }],
			expect.any(String),
			expect.any(String),
		);
		expect(mockedInsertOrUpdateUsers).toHaveBeenCalledWith(
			expect.anything(),
			[{ id: greta.id, name: 'Greta', enabled: true }],
			expect.any(String),
			expect.any(String),
		);
		expect(mockedInsertOrUpdateOrganizationMemberships).toHaveBeenCalledWith(
			expect.anything(),
			[
				{
					userKeycloakUserId: greta.id,
					organizationKeycloakId: funderdome.id,
				},
			],
			expect.any(String),
		);
		expect(mockedCreateServiceQueryAuditLog).toHaveBeenCalledWith(
			expect.anything(),
			null,
			{
				queryName: 'organizations.syncFromKeycloak',
				queryParameters: {
					organizations: { seen: 1, added: 0, updated: 1, disabled: 0 },
					memberships: { seen: 1, added: 0, updated: 1, disabled: 0 },
				},
			},
		);
		expect(mockedUpdateOrganizationSyncTask).toHaveBeenLastCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({
				status: TaskStatus.COMPLETED,
				details: {
					organizations: { seen: 1, added: 0, updated: 1, disabled: 0 },
					memberships: { seen: 1, added: 0, updated: 1, disabled: 0 },
				},
			}),
			17,
		);
	});

	it('counts inserted and disabled rows in the summary', async () => {
		memberPages([greta, hikari]);
		mockedInsertOrUpdateOrganizations.mockResolvedValue([
			{ wasInserted: true },
		]);
		mockedInsertOrUpdateOrganizationMemberships.mockResolvedValue([
			{ wasInserted: true },
			{ wasInserted: false },
		]);
		mockedDisableOrganizationsLastSyncedBefore.mockResolvedValue([
			{ keycloak_organization_id: '66666666-7777-4333-8333-666666666666' },
		]);
		mockedDisableManyLastSyncedBeforeByOrganizationId.mockResolvedValue([
			{ keycloak_user_id: '77777777-8888-4333-8333-777777777777' },
		]);

		await expect(
			syncOrganizationsFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();

		expect(mockedDisableOrganizationsLastSyncedBefore).toHaveBeenCalledWith(
			expect.anything(),
			'2666-06-06T06:06:06.666Z',
			'2666-06-06T06:06:06.666Z',
		);
		expect(
			mockedDisableManyLastSyncedBeforeByOrganizationId,
		).toHaveBeenCalledWith(
			expect.anything(),
			funderdome.id,
			'2666-06-06T06:06:06.666Z',
			'2666-06-06T06:06:06.666Z',
		);
		expect(mockedUpdateOrganizationSyncTask).toHaveBeenLastCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({
				details: {
					organizations: { seen: 1, added: 1, updated: 0, disabled: 1 },
					memberships: { seen: 2, added: 1, updated: 1, disabled: 1 },
				},
			}),
			17,
		);
	});

	it('keeps confirmed memberships of disabled organizations', async () => {
		const archived: KeycloakOrganizationRepresentation = {
			id: stringToKeycloakId('55555555-6666-4333-8333-555555555555'),
			name: 'Archived',
			enabled: false,
		};
		organizationPages([funderdome, archived]);
		memberPages([greta]);
		mockedInsertOrUpdateOrganizations.mockResolvedValue([
			{ wasInserted: false },
			{ wasInserted: false },
		]);

		await expect(
			syncOrganizationsFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();

		expect(mockedDisableOrganizationsLastSyncedBefore).toHaveBeenCalledWith(
			expect.anything(),
			'2666-06-06T06:06:06.666Z',
			'2666-06-06T06:06:06.666Z',
		);
		expect(mockedDisableManyLastSyncedBefore).toHaveBeenCalledWith(
			expect.anything(),
			'2666-06-06T06:06:06.666Z',
			'2666-06-06T06:06:06.666Z',
		);
		expect(mockedUpdateOrganizationSyncTask).toHaveBeenLastCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({
				details: {
					organizations: { seen: 2, added: 0, updated: 2, disabled: 1 },
					memberships: { seen: 2, added: 0, updated: 2, disabled: 0 },
				},
			}),
			17,
		);
	});

	it('sweeps memberships when an organization lists no members', async () => {
		memberPages();
		mockedDisableManyLastSyncedBeforeByOrganizationId.mockResolvedValue([
			{ keycloak_user_id: '77777777-8888-4333-8333-777777777777' },
		]);

		await expect(
			syncOrganizationsFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();

		expect(
			mockedDisableManyLastSyncedBeforeByOrganizationId,
		).toHaveBeenCalledWith(
			expect.anything(),
			funderdome.id,
			'2666-06-06T06:06:06.666Z',
			'2666-06-06T06:06:06.666Z',
		);
	});

	it('skips both sweeps when the organization listing is empty', async () => {
		organizationPages();
		memberPages();

		await expect(
			syncOrganizationsFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();

		expect(mockedInsertOrUpdateOrganizations).not.toHaveBeenCalled();
		expect(mockedInsertOrUpdateOrganizationMemberships).not.toHaveBeenCalled();
		expect(mockedDisableOrganizationsLastSyncedBefore).not.toHaveBeenCalled();
		expect(mockedDisableManyLastSyncedBefore).not.toHaveBeenCalled();
		expect(
			mockedDisableManyLastSyncedBeforeByOrganizationId,
		).not.toHaveBeenCalled();
		expect(mockedUpdateOrganizationSyncTask).toHaveBeenLastCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({
				details: {
					organizations: { seen: 0, added: 0, updated: 0, disabled: 0 },
					memberships: { seen: 0, added: 0, updated: 0, disabled: 0 },
				},
			}),
			17,
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
			failingOrganizationPages(listingError);

			await expect(
				syncOrganizationsFromKeycloak(validPayload, getMockJobHelpers()),
			).resolves.toBeUndefined();

			expect(mockedInsertOrUpdateOrganizations).not.toHaveBeenCalled();
			expect(mockedUpdateOrganizationSyncTask).toHaveBeenCalledWith(
				expect.anything(),
				null,
				expect.objectContaining({ status: TaskStatus.FAILED }),
				17,
			);
		},
	);

	it('marks the task FAILED for unexpected database errors without rethrowing', async () => {
		mockedInsertOrUpdateOrganizations.mockRejectedValue(
			new TinyPgError('bad insert'),
		);

		await expect(
			syncOrganizationsFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();

		expect(mockedUpdateOrganizationSyncTask).toHaveBeenCalledWith(
			expect.anything(),
			null,
			expect.objectContaining({ status: TaskStatus.FAILED }),
			17,
		);
	});

	it('resolves even when marking the task FAILED fails', async () => {
		failingOrganizationPages(new KeycloakAdminApiError('request failed'));
		mockedUpdateOrganizationSyncTask.mockRejectedValue(
			new TinyPgError('statement timeout'),
		);

		await expect(
			syncOrganizationsFromKeycloak(validPayload, getMockJobHelpers()),
		).resolves.toBeUndefined();
	});
});
const mockDatabase = { sql: jest.fn() };
