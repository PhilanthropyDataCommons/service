import request from 'supertest';
import { app } from '../app';
import { getDatabase, loadTableMetrics } from '../database';
import { createTestFunder, createTestTerminologySet } from '../test/factories';
import { getAuthContext, loadTestUser } from '../test/utils';
import { expectArray, expectTimestamp } from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';

describe('/terminologySets', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/terminologySets').expect(401);
		});

		it('requires administrator role', async () => {
			await request(app).get('/terminologySets').set(authHeader).expect(401);
		});

		it('returns all terminology sets for an administrator', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const funderA = await createTestFunder(db, testUserAuthContext);
			const funderB = await createTestFunder(db, testUserAuthContext);
			const setA = await createTestTerminologySet(db, testUserAuthContext, {
				funderShortCode: funderA.shortCode,
				name: 'A',
			});
			const setB = await createTestTerminologySet(db, testUserAuthContext, {
				funderShortCode: funderB.shortCode,
				name: 'B',
			});

			const response = await request(app)
				.get('/terminologySets')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				entries: [setA, setB],
				total: 2,
			});
		});

		it('filters by funder short code when ?funder is provided', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const targetFunder = await createTestFunder(db, testUserAuthContext);
			const otherFunder = await createTestFunder(db, testUserAuthContext);
			const targetSet = await createTestTerminologySet(
				db,
				testUserAuthContext,
				{
					funderShortCode: targetFunder.shortCode,
					name: 'Target',
				},
			);
			await createTestTerminologySet(db, testUserAuthContext, {
				funderShortCode: otherFunder.shortCode,
				name: 'Other',
			});

			const response = await request(app)
				.get(`/terminologySets?funder=${targetFunder.shortCode}`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				entries: [targetSet],
				total: 1,
			});
		});

		it('returns 400 when ?funder is not a valid short code', async () => {
			const response = await request(app)
				.get('/terminologySets?funder=not a short code!')
				.set(authHeaderWithAdminRole)
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});
	});

	describe('GET /:terminologySetId', () => {
		it('requires authentication', async () => {
			await request(app).get('/terminologySets/1').expect(401);
		});

		it('requires administrator role', async () => {
			await request(app).get('/terminologySets/1').set(authHeader).expect(401);
		});

		it('returns 400 when id is not numeric', async () => {
			const result = await request(app)
				.get('/terminologySets/abc')
				.set(authHeaderWithAdminRole)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when the terminology set does not exist', async () => {
			await request(app)
				.get('/terminologySets/9001')
				.set(authHeaderWithAdminRole)
				.expect(404);
		});

		it('returns the terminology set for an administrator', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const terminologySet = await createTestTerminologySet(
				db,
				testUserAuthContext,
			);

			const response = await request(app)
				.get(`/terminologySets/${terminologySet.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual(terminologySet);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/terminologySets').expect(401);
		});

		it('requires administrator role', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createTestFunder(db, testUserAuthContext);
			const before = await loadTableMetrics(db, 'terminology_sets');
			await request(app)
				.post('/terminologySets')
				.type('application/json')
				.set(authHeader)
				.send({ funderShortCode: funder.shortCode, name: 'Nope' })
				.expect(401);
			const after = await loadTableMetrics(db, 'terminology_sets');
			expect(after.count).toEqual(before.count);
		});

		it('returns 400 when funderShortCode is missing', async () => {
			const result = await request(app)
				.post('/terminologySets')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ name: 'No funder' })
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('creates a terminology set for an administrator', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createTestFunder(db, testUserAuthContext);
			const before = await loadTableMetrics(db, 'terminology_sets');
			const response = await request(app)
				.post('/terminologySets')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					funderShortCode: funder.shortCode,
					name: 'RFP Vocabulary',
					proposalLabel: 'Funding Request',
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'terminology_sets');
			expect(after.count).toEqual(before.count + 1);
			expect(response.body).toMatchObject({
				funderShortCode: funder.shortCode,
				name: 'RFP Vocabulary',
				proposalLabel: 'Funding Request',
				opportunityLabel: null,
				createdAt: expectTimestamp(),
			});
		});
	});

	describe('PATCH /:terminologySetId', () => {
		it('requires authentication', async () => {
			await request(app).patch('/terminologySets/1').expect(401);
		});

		it('requires administrator role', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const terminologySet = await createTestTerminologySet(
				db,
				testUserAuthContext,
			);
			await request(app)
				.patch(`/terminologySets/${terminologySet.id}`)
				.type('application/json')
				.set(authHeader)
				.send({ proposalLabel: 'Submission' })
				.expect(401);
		});

		it('returns 400 when id is not numeric', async () => {
			const result = await request(app)
				.patch('/terminologySets/abc')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ proposalLabel: 'Funding Request' })
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('updates only the supplied labels', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const terminologySet = await createTestTerminologySet(
				db,
				testUserAuthContext,
				{
					name: 'Original',
					opportunityLabel: 'Opportunity',
					proposalLabel: 'Proposal',
				},
			);

			const response = await request(app)
				.patch(`/terminologySets/${terminologySet.id}`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ proposalLabel: 'Funding Request' })
				.expect(200);
			expect(response.body).toEqual({
				...terminologySet,
				proposalLabel: 'Funding Request',
			});
		});

		it('returns 400 when body is empty', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const terminologySet = await createTestTerminologySet(
				db,
				testUserAuthContext,
			);
			const result = await request(app)
				.patch(`/terminologySets/${terminologySet.id}`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});
	});
});
