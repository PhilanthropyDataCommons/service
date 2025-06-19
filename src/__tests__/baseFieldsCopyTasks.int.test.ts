import request from 'supertest';
import { app } from '../app';
import {
	db,
	createBaseFieldsCopyTask,
	createOrUpdateUser,
	loadTableMetrics,
} from '../database';
import { getAuthContext, loadTestUser } from '../test/utils';
import {
	expectArray,
	expectNumber,
	expectTimestamp,
} from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { TaskStatus } from '../types';

const MOCK_API_URL = 'https://example.com';
const agent = request.agent(app);

describe('/tasks/baseFieldsCopy', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/tasks/baseFieldsCopy').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.get('/tasks/baseFieldsCopy').set(authHeader).expect(401);
		});

		it('returns an empty Bundle when no data is present', async () => {
			await request(app)
				.get('/tasks/baseFieldsCopy')
				.set(authHeaderWithAdminRole)
				.expect(200, {
					total: 0,
					entries: [],
				});
		});

		it('returns all BaseFieldsCopy Tasks for administrative users', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const anotherUser = await createOrUpdateUser(db, null, {
				keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			});
			const anotherUserAuthContext = getAuthContext(anotherUser);

			await createBaseFieldsCopyTask(db, testUserAuthContext, {
				pdcApiUrl: MOCK_API_URL,
				status: TaskStatus.PENDING,
			});

			await createBaseFieldsCopyTask(db, anotherUserAuthContext, {
				pdcApiUrl: MOCK_API_URL,
				status: TaskStatus.COMPLETED,
			});

			await request(app)
				.get('/tasks/baseFieldsCopy')
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) => {
					expect(res.body).toEqual({
						total: 2,
						entries: [
							{
								id: 2,
								status: TaskStatus.COMPLETED,
								statusUpdatedAt: expectTimestamp(),
								pdcApiUrl: MOCK_API_URL,
								createdAt: expectTimestamp(),
								createdBy: anotherUser.keycloakUserId,
							},
							{
								id: 1,
								status: TaskStatus.PENDING,
								statusUpdatedAt: expectTimestamp(),
								pdcApiUrl: MOCK_API_URL,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
							},
						],
					});
				});
		});

		it('supports pagination', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			await Array.from(Array(20)).reduce(async (p) => {
				await p;
				await createBaseFieldsCopyTask(db, testUserAuthContext, {
					pdcApiUrl: MOCK_API_URL,
					status: TaskStatus.COMPLETED,
				});
			}, Promise.resolve());

			await request(app)
				.get('/tasks/baseFieldsCopy')
				.query({
					_page: 2,
					_count: 5,
				})
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) => {
					expect(res.body).toEqual({
						total: 20,
						entries: [
							{
								id: 15,
								status: TaskStatus.COMPLETED,
								statusUpdatedAt: expectTimestamp(),
								pdcApiUrl: MOCK_API_URL,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 14,
								status: TaskStatus.COMPLETED,
								statusUpdatedAt: expectTimestamp(),
								pdcApiUrl: MOCK_API_URL,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 13,
								status: TaskStatus.COMPLETED,
								statusUpdatedAt: expectTimestamp(),
								pdcApiUrl: MOCK_API_URL,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 12,
								status: TaskStatus.COMPLETED,
								statusUpdatedAt: expectTimestamp(),
								pdcApiUrl: MOCK_API_URL,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 11,
								status: TaskStatus.COMPLETED,
								statusUpdatedAt: expectTimestamp(),
								pdcApiUrl: MOCK_API_URL,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
							},
						],
					});
				});
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/tasks/baseFieldsCopy').expect(401);
		});

		it('requires administrator role', async () => {
			await request(app)
				.post('/tasks/baseFieldsCopy')
				.set(authHeader)
				.expect(401);
		});

		it('throws an error if a synchzronizationUrl is not provided', async () => {
			const result = await request(app)
				.post('/tasks/baseFieldsCopy')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('throws an error if a synchzronizationUrl is not provided', async () => {
			const result = await request(app)
				.post('/tasks/baseFieldsCopy')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('creates exactly one BaseField copy task', async () => {
			const before = await loadTableMetrics('base_fields_copy_tasks');
			const result = await request(app)
				.post('/tasks/baseFieldsCopy')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					pdcApiUrl: MOCK_API_URL,
				})
				.expect(201);
			const after = await loadTableMetrics('base_fields_copy_tasks');
			const testUser = await loadTestUser();

			expect(before.count).toEqual(0);
			expect(result.body).toEqual({
				id: expectNumber(),
				status: 'pending',
				pdcApiUrl: MOCK_API_URL,
				statusUpdatedAt: expectTimestamp(),
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(1);
		});

		it('returns 400 bad request when no synchronization url is provided', async () => {
			const result = await request(app)
				.post('/tasks/baseFieldsCopy')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					knockknock: 'whos there?',
					orange: 'oh. weird.',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});
	});
});
