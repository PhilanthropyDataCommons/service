import { addUserContext } from '../addUserContext';
import {
	getDatabase,
	loadEphemeralAuthContextByTokenId,
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
import {
	InputValidationError,
	NoDataReturnedError,
	NotFoundError,
	UnauthorizedError,
} from '../../errors';
import { getMockRequest, getMockResponse } from '../../test/mockExpress';
import type { AuthenticatedRequest } from '../../types';

describe('addUserContext', () => {
	it('does not creates or assign a user when auth is not provided', (done) => {
		const db = getDatabase();
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();

		loadTableMetrics(db, 'users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async (err: unknown) => {
					expect(err).toBe(undefined);
					const { count: userCount } = await loadTableMetrics(db, 'users');
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
		const db = getDatabase();
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: '123e4567-e89b-12d3-a456-426614174000',
			name: 'Olivia',
			exp: Math.round(new Date().getTime() / 1000) + 3600,
			jti: 'oliviaToken',
		};

		loadTableMetrics(db, 'users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async (err: unknown) => {
					expect(err).toBe(undefined);
					const { count: userCount } = await loadTableMetrics(db, 'users');
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

	it('passes an error and does not assign a user when the token has no exp', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: '123e4567-e89b-12d3-a456-426614174000',
			name: 'Ruth',
		};

		const runAssertions = (err: unknown) => {
			expect(err).toBeInstanceOf(UnauthorizedError);
			expect(req.user).toBe(undefined);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addUserContext(req, res, nextMock);
	});

	it('creates ephemeral user group associations that outlive a token about to expire', (done) => {
		const db = getDatabase();
		const mockSub = '123e4567-e89b-12d3-a456-426614174000';
		const mockAuthExp = Math.round(new Date().getTime() / 1000) + 60;
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: mockSub,
			name: 'Sabine',
			exp: mockAuthExp,
			jti: 'sabineToken',
			organizations: {
				myOrganization: { id: '47d406ad-5e50-42d4-88f1-f87947a3e314' },
			},
		};

		const runAssertions = async (err: unknown) => {
			expect(err).toBe(undefined);
			const ephemeralUserGroupAssociations =
				await loadEphemeralUserGroupAssociationsByUserKeycloakUserId(
					db,
					null,
					stringToKeycloakId(mockSub),
					undefined,
					undefined,
				);
			const expirations = ephemeralUserGroupAssociations.entries.map((item) =>
				new Date(item.notAfter).getTime(),
			);
			expect(expirations).toHaveLength(1);
			expect(Math.min(...expirations)).toBeGreaterThan(mockAuthExp * 1000);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addUserContext(req, res, nextMock);
	});

	it('creates ephemeral user group associations when organizations are provided', (done) => {
		const db = getDatabase();
		const mockSub = '123e4567-e89b-12d3-a456-426614174000';
		const mockName = 'Provolone';
		const mockAuthExp = Math.round(new Date().getTime() / 1000) + 3600;
		const associationLifetimeMs = 180 * 1000;
		const requestedAt = new Date().getTime();
		const myOrganizationId = '47d406ad-5e50-42d4-88f1-f87947a3e314';
		const myOtherOrganizationId = '95e06557-6141-4be5-81df-e7f1a14bff5d';
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: mockSub,
			name: mockName,
			exp: mockAuthExp,
			jti: 'provoloneToken',
			organizations: {
				myOrganization: { id: myOrganizationId },
				myOtherOrganization: { id: myOtherOrganizationId },
			},
		};

		loadTableMetrics(db, 'ephemeral_user_group_associations')
			.then(({ count: baselineEphemeralUserGroupAssociationCount }) => {
				const runAssertions = async (err: unknown) => {
					expect(err).toBe(undefined);
					const { count: ephemeralUserGroupAssociationCount } =
						await loadTableMetrics(db, 'ephemeral_user_group_associations');
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
					const assertedAt = new Date().getTime();
					ephemeralUserGroupAssociationExpirations.forEach((expiration) => {
						expect(expiration).toBeGreaterThanOrEqual(
							requestedAt + associationLifetimeMs,
						);
						expect(expiration).toBeLessThanOrEqual(
							assertedAt + associationLifetimeMs,
						);
					});
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

	it('records an ephemeral auth context that lasts 180 seconds from the request', (done) => {
		const db = getDatabase();
		const mockSub = '123e4567-e89b-12d3-a456-426614174000';
		const lifetimeMs = 180 * 1000;
		const requestedAt = new Date().getTime();
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: mockSub,
			name: 'Provolone',
			exp: Math.round(requestedAt / 1000) + 3600,
			jti: 'provoloneToken',
		};

		const runAssertions = async (err: unknown) => {
			expect(err).toBe(undefined);
			const authContext = await loadEphemeralAuthContextByTokenId(
				db,
				null,
				stringToKeycloakId(mockSub),
				'provoloneToken',
			);
			expect(authContext).toEqual({
				tokenId: 'provoloneToken',
				userKeycloakUserId: mockSub,
				notAfter: expectTimestamp(),
				createdAt: expectTimestamp(),
			});
			const notAfter = new Date(authContext.notAfter).getTime();
			expect(notAfter).toBeGreaterThanOrEqual(requestedAt + lifetimeMs);
			expect(notAfter).toBeLessThanOrEqual(new Date().getTime() + lifetimeMs);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addUserContext(req, res, nextMock);
	});

	it('extends the ephemeral auth context on each request with the same token', (done) => {
		const db = getDatabase();
		const mockSub = '123e4567-e89b-12d3-a456-426614174000';
		const auth = {
			sub: mockSub,
			name: 'Quentin',
			exp: Math.round(new Date().getTime() / 1000) + 3600,
			jti: 'quentinToken',
		};
		const firstReq = getMockRequest() as AuthenticatedRequest;
		const secondReq = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		firstReq.auth = auth;
		secondReq.auth = auth;
		const lapsedNotAfter = '2000-01-01T00:00:00.000Z';

		const runAssertions = async (err: unknown) => {
			expect(err).toBe(undefined);
			const authContext = await loadEphemeralAuthContextByTokenId(
				db,
				null,
				stringToKeycloakId(mockSub),
				'quentinToken',
			);
			expect(new Date(authContext.notAfter).getTime()).toBeGreaterThan(
				new Date().getTime(),
			);
		};

		const firstNext = (firstErr?: unknown): void => {
			if (firstErr !== undefined) {
				done(firstErr);
				return;
			}
			db.query(
				'UPDATE ephemeral_auth_contexts SET not_after = :notAfter WHERE token_id = :tokenId;',
				{ notAfter: lapsedNotAfter, tokenId: 'quentinToken' },
			)
				.then(() => {
					addUserContext(
						secondReq,
						res,
						generateNextWithAssertions(runAssertions, done),
					);
				})
				.catch((e: unknown) => {
					done(e);
				});
		};
		addUserContext(firstReq, res, firstNext);
	});

	it('passes an error when the token has no jti', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: '123e4567-e89b-12d3-a456-426614174000',
			name: 'Rhoda',
			exp: Math.round(new Date().getTime() / 1000) + 3600,
		};

		const runAssertions = (err: unknown) => {
			expect(err).toBeInstanceOf(UnauthorizedError);
			expect(req.user).toBe(undefined);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addUserContext(req, res, nextMock);
	});

	it('passes an error and records nothing when a different user presents a jti that was already recorded', (done) => {
		const db = getDatabase();
		const firstReq = getMockRequest() as AuthenticatedRequest;
		const secondReq = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		firstReq.auth = {
			sub: '123e4567-e89b-12d3-a456-426614174000',
			name: 'Sven',
			exp: Math.round(new Date().getTime() / 1000) + 3600,
			jti: 'sharedToken',
		};
		secondReq.auth = {
			sub: '223e4567-e89b-12d3-a456-426614174000',
			name: 'Tove',
			exp: Math.round(new Date().getTime() / 1000) + 3600,
			jti: 'sharedToken',
		};

		const runAssertions = async (err: unknown) => {
			expect(err).toBeInstanceOf(NoDataReturnedError);
			expect(secondReq.user).toBe(undefined);
			await expect(
				loadUserByKeycloakUserId(
					db,
					null,
					stringToKeycloakId('223e4567-e89b-12d3-a456-426614174000'),
				),
			).rejects.toBeInstanceOf(NotFoundError);
		};

		const firstNext = (firstErr?: unknown): void => {
			if (firstErr !== undefined) {
				done(firstErr);
				return;
			}
			addUserContext(
				secondReq,
				res,
				generateNextWithAssertions(runAssertions, done),
			);
		};
		addUserContext(firstReq, res, firstNext);
	});

	it('passes an error and does not creates or assign a user when an invalid keycloakUserId is provided', (done) => {
		const db = getDatabase();
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: 'this is not a UUID',
			name: 'Qualita',
		};

		loadTableMetrics(db, 'users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async (err: unknown) => {
					const { count: userCount } = await loadTableMetrics(db, 'users');
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
		const db = getDatabase();
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			name: 'Robert',
		};

		loadTableMetrics(db, 'users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async () => {
					const metrics = await loadTableMetrics(db, 'users');
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
