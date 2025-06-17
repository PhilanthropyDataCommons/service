import { addUserContext } from '../addUserContext';
import {
	db,
	loadUserByKeycloakUserId,
	loadTableMetrics,
	loadEphemeralUserGroupAssociationsByUserKeycloakUserId,
} from '../../database';
import { expectTimestamp, generateNextWithAssertions } from '../../test/utils';
import { stringToKeycloakId } from '../../types';
import { InputValidationError } from '../../errors';
import type { AuthenticatedRequest } from '../../types';
import type { Response } from 'express';

describe('addUserContext', () => {
	it('does not creates or assign a user when auth is not provided', (done) => {
		const mockRequest = {} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

		loadTableMetrics('users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async (err: unknown) => {
					expect(err).toBe(undefined);
					const { count: userCount } = await loadTableMetrics('users');
					expect(userCount).toEqual(baselineUserCount);
					expect(mockRequest.user).toBe(undefined);
				};

				const nextMock = generateNextWithAssertions(runAssertions, done);
				addUserContext(mockRequest, mockResponse, nextMock);
			})
			.catch((e) => {
				done(e);
			});
	});

	it('creates and assigns a user when a keycloakUserId is provided', (done) => {
		const mockRequest = {
			auth: {
				sub: '123e4567-e89b-12d3-a456-426614174000',
			},
		} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

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
					expect(mockRequest.user).toEqual(user);
					expect(userCount).toEqual(baselineUserCount + 1);
				};

				const nextMock = generateNextWithAssertions(runAssertions, done);
				addUserContext(mockRequest, mockResponse, nextMock);
			})
			.catch((e) => {
				done(e);
			});
	});

	it('creates ephemeral user group associations when organizations are provided', (done) => {
		const mockSub = '123e4567-e89b-12d3-a456-426614174000';
		const mockAuthExp = Math.round(new Date().getTime() / 1000) + 3600;
		const expectedNotAfter = new Date(mockAuthExp * 1000).toISOString();
		const myOrganizationId = '47d406ad-5e50-42d4-88f1-f87947a3e314';
		const myOtherOrganizationId = '95e06557-6141-4be5-81df-e7f1a14bff5d';
		const mockRequest = {
			auth: {
				sub: mockSub,
				exp: mockAuthExp,
				organizations: {
					myOrganization: { id: myOrganizationId },
					myOtherOrganization: { id: myOtherOrganizationId },
				},
			},
		} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

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
						expect.arrayContaining([
							{
								createdAt: expectTimestamp,
								userGroupKeycloakOrganizationId: myOrganizationId,
								userKeycloakUserId: mockSub,
								notAfter: expectTimestamp,
							},
							{
								createdAt: expectTimestamp,
								userGroupKeycloakOrganizationId: myOtherOrganizationId,
								userKeycloakUserId: mockSub,
								notAfter: expectTimestamp,
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
				addUserContext(mockRequest, mockResponse, nextMock);
			})
			.catch((e) => {
				done(e);
			});
	});

	it('passes an error and does not creates or assign a user when an invalid keycloakUserId is provided', (done) => {
		const mockRequest = {
			auth: {
				sub: 'this is not a UUID',
			},
		} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

		loadTableMetrics('users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async (err: unknown) => {
					const { count: userCount } = await loadTableMetrics('users');
					expect(userCount).toEqual(baselineUserCount);
					expect(mockRequest.user).toBe(undefined);
					expect(err).toBeInstanceOf(InputValidationError);
					expect((err as InputValidationError).message).toEqual(
						'auth subject must be a valid keycloak user id',
					);
				};

				const nextMock = generateNextWithAssertions(runAssertions, done);
				addUserContext(mockRequest, mockResponse, nextMock);
			})
			.catch((e) => {
				done(e);
			});
	});

	it('does not create or assign a user when no keycloakUserId is provided', (done) => {
		const mockRequest = {
			auth: {},
		} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

		loadTableMetrics('users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async () => {
					const metrics = await loadTableMetrics('users');
					expect(metrics.count).toEqual(baselineUserCount);
					expect(mockRequest.user).toBe(undefined);
				};

				const nextMock = generateNextWithAssertions(runAssertions, done);
				addUserContext(mockRequest, mockResponse, nextMock);
			})
			.catch((e) => {
				done(e);
			});
	});
});
