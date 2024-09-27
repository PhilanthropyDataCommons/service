import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { app } from '../app';
import { createUser, loadSystemUser, loadTableMetrics } from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { keycloakUserIdToString, stringToKeycloakUserId } from '../types';

const createAdditionalTestUser = async () =>
	createUser({
		keycloakUserId: stringToKeycloakUserId(
			'123e4567-e89b-12d3-a456-426614174000',
		),
	});

describe('/users', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/users').expect(401);
		});

		it('returns the user associated with the requesting user', async () => {
			const testUser = await loadTestUser();
			await createAdditionalTestUser();
			const { count: userCount } = await loadTableMetrics('users');

			const response = await request(app)
				.get('/users')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [testUser],
			});
		});

		it('returns all users when the user is an administrator', async () => {
			const systemUser = await loadSystemUser();
			const testUser = await loadTestUser();
			const anotherUser = await createAdditionalTestUser();
			const { count: userCount } = await loadTableMetrics('users');

			const response = await request(app)
				.get('/users')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [anotherUser, testUser, systemUser],
			});
		});

		it('returns a specific user when a keycloakUserId is provided', async () => {
			const anotherUser = await createAdditionalTestUser();
			const { count: userCount } = await loadTableMetrics('users');

			const response = await request(app)
				.get(
					`/users?keycloakUserId=${keycloakUserIdToString(anotherUser.keycloakUserId)}`,
				)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [anotherUser],
			});
		});

		it('returns 400 when an invalid keycloakUserId is provided', async () => {
			await request(app)
				.get(`/users?keycloakUserId=thisisnotauuid`)
				.set(authHeaderWithAdminRole)
				.expect(400);
		});

		it('returns according to pagination parameters', async () => {
			const { count: baseUserCount } = await loadTableMetrics('users');
			const uuids = Array.from(Array(20)).map(() => uuidv4());
			await uuids.reduce(async (p, uuid) => {
				await p;
				await createUser({
					keycloakUserId: uuid,
				});
			}, Promise.resolve());
			const { count: userCount } = await loadTableMetrics('users');

			const response = await request(app)
				.get('/users')
				.query({
					_page: 2,
					_count: 5,
				})
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [
					{
						id: 15 + baseUserCount,
						keycloakUserId: uuids[14],
						createdAt: expectTimestamp,
					},
					{
						id: 14 + baseUserCount,
						keycloakUserId: uuids[13],
						createdAt: expectTimestamp,
					},
					{
						id: 13 + baseUserCount,
						keycloakUserId: uuids[12],
						createdAt: expectTimestamp,
					},
					{
						id: 12 + baseUserCount,
						keycloakUserId: uuids[11],
						createdAt: expectTimestamp,
					},
					{
						id: 11 + baseUserCount,
						keycloakUserId: uuids[10],
						createdAt: expectTimestamp,
					},
				],
			});
		});
	});
});
