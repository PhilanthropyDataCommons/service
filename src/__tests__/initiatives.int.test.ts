import request from 'supertest';
import { app } from '../app';
import { getDatabase, loadTableMetrics } from '../database';
import { loadUnifiedAuditLogBundle } from '../database/operations/unifiedAuditLogs';
import { createTestChangemaker, createTestInitiative } from '../test/factories';
import {
	getAuthContext,
	getTestAuthContext,
	loadTestUser,
	NO_LIMIT,
	NO_OFFSET,
} from '../test/utils';
import {
	expectArray,
	expectObjectContaining,
	expectTimestamp,
} from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';

describe('/initiatives', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/initiatives').expect(401);
		});

		it('requires administrator role', async () => {
			await request(app).get('/initiatives').set(authHeader).expect(401);
		});

		it('returns an empty bundle when no data is present', async () => {
			await request(app)
				.get('/initiatives')
				.set(authHeaderWithAdminRole)
				.expect(200, {
					entries: [],
					total: 0,
				});
		});

		it('returns all initiatives', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiativeA = await createTestInitiative(db, testUserAuthContext, {
				title: 'A',
			});
			const initiativeB = await createTestInitiative(db, testUserAuthContext, {
				title: 'B',
			});

			const response = await request(app)
				.get('/initiatives')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				entries: [initiativeA, initiativeB],
				total: 2,
			});
		});

		it('filters by changemaker', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const targetChangemaker = await createTestChangemaker(
				db,
				testUserAuthContext,
			);
			const targetInitiative = await createTestInitiative(
				db,
				testUserAuthContext,
				{ changemakerId: targetChangemaker.id, title: 'Target' },
			);
			await createTestInitiative(db, testUserAuthContext, { title: 'Other' });

			const response = await request(app)
				.get(`/initiatives?changemaker=${targetChangemaker.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				entries: [targetInitiative],
				total: 1,
			});
		});

		it('returns 400 when changemaker is not a valid id', async () => {
			const response = await request(app)
				.get('/initiatives?changemaker=not_a_valid_id')
				.set(authHeaderWithAdminRole)
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});
	});

	describe('GET /:initiativeId', () => {
		it('requires authentication', async () => {
			await request(app).get('/initiatives/1').expect(401);
		});

		it('requires administrator role', async () => {
			await request(app).get('/initiatives/1').set(authHeader).expect(401);
		});

		it('returns 400 when id is not numeric', async () => {
			const response = await request(app)
				.get('/initiatives/not_a_valid_id')
				.set(authHeaderWithAdminRole)
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when the initiative does not exist', async () => {
			await request(app)
				.get('/initiatives/9001')
				.set(authHeaderWithAdminRole)
				.expect(404);
		});

		it('returns the initiative', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);

			const response = await request(app)
				.get(`/initiatives/${initiative.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual(initiative);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/initiatives').expect(401);
		});

		it('requires administrator role', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);

			await request(app)
				.post('/initiatives')
				.type('application/json')
				.set(authHeader)
				.send({
					changemakerId: changemaker.id,
					title: 'Clean Water for the Lower Valley',
				})
				.expect(401);
		});

		it('returns 400 when the title is missing', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);

			const response = await request(app)
				.post('/initiatives')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ changemakerId: changemaker.id })
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when the changemaker does not exist', async () => {
			await request(app)
				.post('/initiatives')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					changemakerId: 9001,
					title: 'Clean Water for the Lower Valley',
				})
				.expect(404);
		});

		it('creates exactly one initiative', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);

			const before = await loadTableMetrics(db, 'initiatives');
			const response = await request(app)
				.post('/initiatives')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					changemakerId: changemaker.id,
					title: 'Clean Water for the Lower Valley',
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'initiatives');

			expect(after.count).toEqual(before.count + 1);
			expect(response.body).toMatchObject({
				changemakerId: changemaker.id,
				title: 'Clean Water for the Lower Valley',
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
		});
	});

	describe('PATCH /:initiativeId', () => {
		it('requires authentication', async () => {
			await request(app).patch('/initiatives/1').expect(401);
		});

		it('requires administrator role', async () => {
			await request(app)
				.patch('/initiatives/1')
				.type('application/json')
				.set(authHeader)
				.send({ title: 'Clean Water for the Upper Valley' })
				.expect(401);
		});

		it('returns 400 when id is not numeric', async () => {
			const response = await request(app)
				.patch('/initiatives/not_a_valid_id')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ title: 'Clean Water for the Upper Valley' })
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 when the body is empty', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);

			const response = await request(app)
				.patch(`/initiatives/${initiative.id}`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 when the body contains an unwritable attribute', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);

			const response = await request(app)
				.patch(`/initiatives/${initiative.id}`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ changemakerId: 9001 })
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when the initiative does not exist', async () => {
			await request(app)
				.patch('/initiatives/9001')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ title: 'Clean Water for the Upper Valley' })
				.expect(404);
		});

		it('updates the title', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext, {
				title: 'Clean Water for the Lower Valley',
			});

			const response = await request(app)
				.patch(`/initiatives/${initiative.id}`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ title: 'Clean Water for the Upper Valley' })
				.expect(200);
			expect(response.body).toEqual({
				...initiative,
				title: 'Clean Water for the Upper Valley',
			});
		});

		it('records the acting user in the audit log', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);

			await request(app)
				.patch(`/initiatives/${initiative.id}`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ title: 'Clean Water for the Upper Valley' })
				.expect(200);

			const auditLogs = await loadUnifiedAuditLogBundle(
				db,
				await getTestAuthContext(db),
				NO_LIMIT,
				NO_OFFSET,
			);
			expect(auditLogs.entries).toContainEqual(
				expectObjectContaining({
					operation: 'Called query initiatives.updateById',
					userKeycloakUserId: testUser.keycloakUserId,
					userIsAdministrator: true,
				}),
			);
		});
	});
});
