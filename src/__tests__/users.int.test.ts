import request from 'supertest';
import { app } from '../app';
import { createUser, loadSystemUser, loadTableMetrics } from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';

const agent = request.agent(app);

describe('/users', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/users').expect(401);
		});

		it('returns the user associated with the requesting user', async () => {
			const testUser = await loadTestUser();
			await createUser({
				authenticationId: 'totallyDifferentUser@example.com',
			});
			const { count: userCount } = await loadTableMetrics('users');

			const response = await agent.get('/users').set(authHeader).expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [testUser],
			});
		});

		it('returns all users when the user is an administrator', async () => {
			const systemUser = await loadSystemUser();
			const testUser = await loadTestUser();
			const anotherUser = await createUser({
				authenticationId: 'totallyDifferentUser@example.com',
			});
			const { count: userCount } = await loadTableMetrics('users');

			const response = await agent
				.get('/users')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [anotherUser, testUser, systemUser],
			});
		});

		it('returns a specific user when an authenticationId is provided', async () => {
			const anotherUser = await createUser({
				authenticationId: 'totallyDifferentUser@example.com',
			});
			const { count: userCount } = await loadTableMetrics('users');

			const response = await agent
				.get('/users?authenticationId=totallyDifferentUser@example.com')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [anotherUser],
			});
		});

		it('returns according to pagination parameters', async () => {
			const { count: baseUserCount } = await loadTableMetrics('users');
			await Array.from(Array(20)).reduce(async (p, _, i) => {
				await p;
				await createUser({
					authenticationId: `user-${i + 1}`,
				});
			}, Promise.resolve());
			const { count: userCount } = await loadTableMetrics('users');

			const response = await agent
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
						authenticationId: 'user-15',
						createdAt: expectTimestamp,
					},
					{
						id: 14 + baseUserCount,
						authenticationId: 'user-14',
						createdAt: expectTimestamp,
					},
					{
						id: 13 + baseUserCount,
						authenticationId: 'user-13',
						createdAt: expectTimestamp,
					},
					{
						id: 12 + baseUserCount,
						authenticationId: 'user-12',
						createdAt: expectTimestamp,
					},
					{
						id: 11 + baseUserCount,
						authenticationId: 'user-11',
						createdAt: expectTimestamp,
					},
				],
			});
		});
	});
});
