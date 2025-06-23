import { addUserContext } from '../addUserContext';
import {
	db,
	loadUserByKeycloakUserId,
	loadTableMetrics,
	loadEphemeralUserGroupAssociationsByUserKeycloakUserId,
} from '../../database';
import { generateNextWithAssertions } from '../../test/utils';
import {
	expectArrayContaining,
	expectTimestamp,
} from '../../test/asymettricMatchers';
import { stringToKeycloakId } from '../../types';
import { InputValidationError } from '../../errors';
import { getMockRequest, getMockResponse } from '../../test/mockExpress';
import type { AuthenticatedRequest } from '../../types';

describe('addUserContext', () => {
	it('does not creates or assign a user when auth is not provided', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();

		loadTableMetrics('users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async (err: unknown) => {
					expect(err).toBe(undefined);
					const { count: userCount } = await loadTableMetrics('users');
					expect(userCount).toEqual(baselineUserCount);
					expect(req.user).toBe(undefined);
				};

				const nextMock = generateNextWithAssertions(runAssertions, done);
				addUserContext(req, res, nextMock);
			})
			.catch((e: unknown) => {
				done(e);
			});
	});

	it('creates and assigns a user when a keycloakUserId is provided', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: '123e4567-e89b-12d3-a456-426614174000',
		};

		loadTableMetrics('users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async (err: unknown) => {
					expect(err).toBe(undefined);
					const { count: userCount } = await loadTableMetrics('users');
					const user = await loadUserByKeycloakUserId(
						db,
						null,
						stringToKeycloakId('123e4567-e89b-12d3-a456-426614174000'),
					);
					expect(req.user).toEqual(user);
					expect(userCount).toEqual(baselineUserCount + 1);
				};

				const nextMock = generateNextWithAssertions(runAssertions, done);
				addUserContext(req, res, nextMock);
			})
			.catch((e: unknown) => {
				done(e);
			});
	});

	it('creates ephemeral user group associations when organizations are provided', (done) => {
		const mockSub = '123e4567-e89b-12d3-a456-426614174000';
		const mockAuthExp = Math.round(new Date().getTime() / 1000) + 3600;
		const expectedNotAfter = new Date(mockAuthExp * 1000).toISOString();
		const myOrganizationId = '47d406ad-5e50-42d4-88f1-f87947a3e314';
		const myOtherOrganizationId = '95e06557-6141-4be5-81df-e7f1a14bff5d';
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: mockSub,
			exp: mockAuthExp,
			organizations: {
				myOrganization: { id: myOrganizationId },
				myOtherOrganization: { id: myOtherOrganizationId },
			},
		};

		loadTableMetrics('ephemeral_user_group_associations')
			.then(({ count: baselineEphemeralUserGroupAssociationCount }) => {
				const runAssertions = async (err: unknown) => {
					expect(err).toBe(undefined);
					const { count: ephemeralUserGroupAssociationCount } =
						await loadTableMetrics('ephemeral_user_group_associations');
					const ephemeralUserGroupAssociations =
						await loadEphemeralUserGroupAssociationsByUserKeycloakUserId(
							db,
							null,
							stringToKeycloakId('123e4567-e89b-12d3-a456-426614174000'),
							undefined,
							undefined,
						);
					expect(ephemeralUserGroupAssociations.entries).toEqual(
						expectArrayContaining([
							{
								createdAt: expectTimestamp(),
								userGroupKeycloakOrganizationId: myOrganizationId,
								userKeycloakUserId: mockSub,
								notAfter: expectTimestamp(),
							},
							{
								createdAt: expectTimestamp(),
								userGroupKeycloakOrganizationId: myOtherOrganizationId,
								userKeycloakUserId: mockSub,
								notAfter: expectTimestamp(),
							},
						]),
					);
					const ephemeralUserGroupAssociationExpirations =
						ephemeralUserGroupAssociations.entries.map((item) =>
							new Date(item.notAfter).getTime(),
						);
					expect(ephemeralUserGroupAssociationExpirations).toEqual([
						new Date(expectedNotAfter).getTime(),
						new Date(expectedNotAfter).getTime(),
					]);
					expect(ephemeralUserGroupAssociationCount).toEqual(
						baselineEphemeralUserGroupAssociationCount + 2,
					);
				};

				const nextMock = generateNextWithAssertions(runAssertions, done);
				addUserContext(req, res, nextMock);
			})
			.catch((e: unknown) => {
				done(e);
			});
	});

	it('passes an error and does not creates or assign a user when an invalid keycloakUserId is provided', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: 'this is not a UUID',
		};

		loadTableMetrics('users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async (err: unknown) => {
					const { count: userCount } = await loadTableMetrics('users');
					expect(userCount).toEqual(baselineUserCount);
					expect(req.user).toBe(undefined);
					expect(err).toBeInstanceOf(InputValidationError);
					/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
					 * We just validated that err is an InputValidationError
					 * but eslint doesn't recognize that fact.
					 */
					expect((err as InputValidationError).message).toEqual(
						'auth subject must be a valid keycloak user id',
					);
				};

				const nextMock = generateNextWithAssertions(runAssertions, done);
				addUserContext(req, res, nextMock);
			})
			.catch((e: unknown) => {
				done(e);
			});
	});

	it('does not create or assign a user when no keycloakUserId is provided', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {};

		loadTableMetrics('users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async () => {
					const metrics = await loadTableMetrics('users');
					expect(metrics.count).toEqual(baselineUserCount);
					expect(req.user).toBe(undefined);
				};

				const nextMock = generateNextWithAssertions(runAssertions, done);
				addUserContext(req, res, nextMock);
			})
			.catch((e: unknown) => {
				done(e);
			});
	});
});
