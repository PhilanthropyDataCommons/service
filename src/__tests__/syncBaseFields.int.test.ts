import request from 'supertest';
import { app } from '../app';
import { createSyncBaseField, createUser, loadTableMetrics } from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { BulkUploadStatus, SyncBasefieldStatus } from '../types';

const MOCK_SYNCHRONIZATION_URL = 'https://remote.pdc.instance.com';

describe('/syncBaseFields', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).post('/syncBaseFields').expect(401);
		});

		it('requires administrator role', async () => {
			await request(app).post('/syncBaseFields').set(authHeader).expect(401);
		});

		it('returns an empty Bundle when no data is present', async () => {
			await request(app)
				.get('/syncBaseFields')
				.set(authHeaderWithAdminRole)
				.expect(200, {
					total: 0,
					entries: [],
				});
		});

		it('returns all Sync BaseFields for administrative users', async () => {
			const testUser = await loadTestUser();
			const anotherUser = await createUser({
				keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			});

			await createSyncBaseField({
				synchronizationUrl: MOCK_SYNCHRONIZATION_URL,
				status: SyncBasefieldStatus.PENDING,
				statusUpdatedAt: new Date().toISOString(),
				createdBy: testUser.keycloakUserId,
			});

			await createSyncBaseField({
				synchronizationUrl: MOCK_SYNCHRONIZATION_URL,
				status: SyncBasefieldStatus.COMPLETED,
				statusUpdatedAt: new Date().toISOString(),
				createdBy: anotherUser.keycloakUserId,
			});

			await request(app)
				.get('/syncBaseFields')
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						total: 2,
						entries: [
							{
								id: 2,
								status: BulkUploadStatus.COMPLETED,
								statusUpdatedAt: expectTimestamp,
								synchronizationUrl: MOCK_SYNCHRONIZATION_URL,
								createdAt: expectTimestamp,
								createdBy: anotherUser.keycloakUserId,
							},
							{
								id: 1,
								status: BulkUploadStatus.PENDING,
								statusUpdatedAt: expectTimestamp,
								synchronizationUrl: MOCK_SYNCHRONIZATION_URL,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
							},
						],
					}),
				);
		});

		it('supports pagination', async () => {
			const testUser = await loadTestUser();
			await Array.from(Array(20)).reduce(async (p) => {
				await p;
				await createSyncBaseField({
					synchronizationUrl: MOCK_SYNCHRONIZATION_URL,
					statusUpdatedAt: new Date().toISOString(),
					status: SyncBasefieldStatus.COMPLETED,
					createdBy: testUser.keycloakUserId,
				});
			}, Promise.resolve());

			await request(app)
				.get('/syncBaseFields')
				.query({
					_page: 2,
					_count: 5,
				})
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						total: 20,
						entries: [
							{
								id: 15,
								status: BulkUploadStatus.COMPLETED,
								statusUpdatedAt: expectTimestamp,
								synchronizationUrl: MOCK_SYNCHRONIZATION_URL,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 14,
								status: BulkUploadStatus.COMPLETED,
								statusUpdatedAt: expectTimestamp,
								synchronizationUrl: MOCK_SYNCHRONIZATION_URL,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 13,
								status: BulkUploadStatus.COMPLETED,
								statusUpdatedAt: expectTimestamp,
								synchronizationUrl: MOCK_SYNCHRONIZATION_URL,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 12,
								status: BulkUploadStatus.COMPLETED,
								statusUpdatedAt: expectTimestamp,
								synchronizationUrl: MOCK_SYNCHRONIZATION_URL,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 11,
								status: BulkUploadStatus.COMPLETED,
								statusUpdatedAt: expectTimestamp,
								synchronizationUrl: MOCK_SYNCHRONIZATION_URL,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
							},
						],
					}),
				);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/syncBaseFields').expect(401);
		});

		it('requires administrator role', async () => {
			await request(app).post('/syncBaseFields').set(authHeader).expect(401);
		});

		it('creates exactly one Sync Base Field', async () => {
			const before = await loadTableMetrics('sync_basefields');
			const result = await request(app)
				.post('/syncBaseFields')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					synchronizationUrl: MOCK_SYNCHRONIZATION_URL,
				})
				.expect(201);
			const after = await loadTableMetrics('sync_basefields');
			const testUser = await loadTestUser();

			expect(before.count).toEqual(0);
			expect(result.body).toEqual({
				id: expect.any(Number) as number,
				status: 'pending',
				synchronizationUrl: MOCK_SYNCHRONIZATION_URL,
				statusUpdatedAt: expectTimestamp,
				createdAt: expectTimestamp,
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(1);
		});

		it('returns 400 bad request when no synchronization url is provided', async () => {
			const result = await request(app)
				.post('/syncBaseFields')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					knockknock: 'whos there?',
					orange: 'oh. weird.',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});
	});
});
