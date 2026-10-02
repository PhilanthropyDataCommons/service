import request from 'supertest';
import { app } from '../app';
import { getDatabase, loadSystemUser, loadTableMetrics } from '../database';
import { loadTestUser } from '../test/utils';
import { createTestUser } from '../test/factories';
import { expectTimestamp } from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
	mockJwtWithRealmManagementManageUsersRole as authHeaderWithManageUsersRole,
	mockJwtWithRealmManagementQueryUsersRole as authHeaderWithQueryUsersRole,
	mockJwtWithRealmManagementViewUsersRole as authHeaderWithViewUsersRole,
} from '../test/mockJwt';
import { keycloakIdToString } from '../types';
import type { User } from '../types';

describe('/users', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/users').expect(401);
		});

		it('returns the user associated with the requesting user', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			await createTestUser(db, null);

			const response = await request(app)
				.get('/users')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 1,
				entries: [
					{
						...testUser,
						createdAt: expectTimestamp(),
					},
				],
			});
		});

		it('returns only the requesting user when the caller carries the pdc-admin realm role but no realm-management user role', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			await createTestUser(db, null);

			const response = await request(app)
				.get('/users')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: 1,
				entries: [
					{
						...testUser,
						createdAt: expectTimestamp(),
					},
				],
			});
		});

		it('returns all users when the caller carries the query-users realm-management role', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser(db);
			const anotherUser = await createTestUser(db, null);
			const { count: userCount } = await loadTableMetrics(db, 'users');

			const response = await request(app)
				.get('/users')
				.set(authHeaderWithQueryUsersRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [anotherUser, testUser, systemUser],
			});
		});

		it('returns all users when the caller carries the view-users realm-management role', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser(db);
			const anotherUser = await createTestUser(db, null);
			const { count: userCount } = await loadTableMetrics(db, 'users');

			const response = await request(app)
				.get('/users')
				.set(authHeaderWithViewUsersRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [anotherUser, testUser, systemUser],
			});
		});

		it('returns all users when the caller carries the manage-users realm-management role', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser(db);
			const anotherUser = await createTestUser(db, null);
			const { count: userCount } = await loadTableMetrics(db, 'users');

			const response = await request(app)
				.get('/users')
				.set(authHeaderWithManageUsersRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [anotherUser, testUser, systemUser],
			});
		});

		it('returns a specific user when a keycloakUserId is provided', async () => {
			const db = getDatabase();
			const anotherUser = await createTestUser(db, null);

			const response = await request(app)
				.get(
					`/users?keycloakUserId=${keycloakIdToString(anotherUser.keycloakUserId)}`,
				)
				.set(authHeaderWithQueryUsersRole)
				.expect(200);
			expect(response.body).toEqual({
				total: 1,
				entries: [anotherUser],
			});
		});

		it('returns 400 when an invalid keycloakUserId is provided', async () => {
			await request(app)
				.get(`/users?keycloakUserId=thisisnotauuid`)
				.set(authHeaderWithQueryUsersRole)
				.expect(400);
		});

		it('returns according to pagination parameters', async () => {
			const db = getDatabase();
			const createdUsers = await Array.from(Array(20)).reduce<Promise<User[]>>(
				async (p) => {
					const acc = await p;
					const user = await createTestUser(db, null);
					return [...acc, user];
				},
				Promise.resolve([]),
			);
			const { count: userCount } = await loadTableMetrics(db, 'users');

			const response = await request(app)
				.get('/users')
				.query({
					_page: 2,
					_count: 5,
				})
				.set(authHeaderWithQueryUsersRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [
					createdUsers[14],
					createdUsers[13],
					createdUsers[12],
					createdUsers[11],
					createdUsers[10],
				],
			});
		});
	});
});
