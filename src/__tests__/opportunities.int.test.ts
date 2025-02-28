import request from 'supertest';
import { app } from '../app';
import {
	db,
	createOpportunity,
	loadTableMetrics,
	loadSystemFunder,
	createOrUpdateUserFunderPermission,
	loadSystemUser,
} from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { Permission } from '../types';

describe('/opportunities', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/opportunities').expect(401);
		});

		it('returns an empty bundle when no data is present', async () => {
			await request(app).get('/opportunities').set(authHeader).expect(200, {
				entries: [],
				total: 0,
			});
		});

		it('returns all opportunities present in the database', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: 'Tremendous opportunity 👌',
				funderShortCode: systemFunder.shortCode,
			});
			await createOpportunity(db, null, {
				title: 'Terrific opportunity 👐',
				funderShortCode: systemFunder.shortCode,
			});
			const response = await request(app)
				.get('/opportunities')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [
					{
						id: 1,
						createdAt: expectTimestamp,
						title: 'Tremendous opportunity 👌',
						funderShortCode: systemFunder.shortCode,
						funder: systemFunder,
					},
					{
						id: 2,
						createdAt: expectTimestamp,
						title: 'Terrific opportunity 👐',
						funderShortCode: systemFunder.shortCode,
						funder: systemFunder,
					},
				],
				total: 2,
			});
		});
	});

	describe('GET /:opportunityId', () => {
		it('requires authentication', async () => {
			await request(app).get('/opportunities/1').expect(401);
		});

		it('returns exactly one opportunity selected by id', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await createOpportunity(db, null, {
				title: '✨',
				funderShortCode: systemFunder.shortCode,
			});
			await createOpportunity(db, null, {
				title: '🚀',
				funderShortCode: systemFunder.shortCode,
			});

			const response = await request(app)
				.get(`/opportunities/2`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				id: 2,
				createdAt: expectTimestamp,
				title: '✨',
				funderShortCode: systemFunder.shortCode,
				funder: systemFunder,
			});
		});

		it('returns an opportunity when the user has funder permission', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.VIEW,
				createdBy: systemUser.keycloakUserId,
			});
			const opportunity = await createOpportunity(db, null, {
				title: '✨',
				funderShortCode: systemFunder.shortCode,
			});
			const response = await request(app)
				.get(`/opportunities/${opportunity.id}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual(opportunity);
		});

		it('returns 400 bad request when id is a letter', async () => {
			const result = await request(app)
				.get('/opportunities/a')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when id is a number greater than 2^32-1', async () => {
			const result = await request(app)
				.get('/opportunities/555555555555555555555555555555')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 404 when id is not found', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: 'This definitely should not be returned',
				funderShortCode: systemFunder.shortCode,
			});
			await request(app)
				.get('/opportunities/9001')
				.set(authHeaderWithAdminRole)
				.expect(404);
		});

		it('returns 404 when the user does not have view permission', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: 'This definitely should not be returned',
				funderShortCode: systemFunder.shortCode,
			});
			await request(app)
				.get(`/opportunities/${opportunity.id}`)
				.set(authHeader)
				.expect(404);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/opportunities').expect(401);
		});

		it('creates and returns exactly one opportunity when edit funder permission is set', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.EDIT,
				createdBy: systemUser.keycloakUserId,
			});
			const before = await loadTableMetrics('opportunities');
			const result = await request(app)
				.post('/opportunities')
				.type('application/json')
				.set(authHeader)
				.send({
					title: '🎆',
					funderShortCode: systemFunder.shortCode,
				})
				.expect(201);
			const after = await loadTableMetrics('opportunities');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: 1,
				title: '🎆',
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});

		it('returns 401 unauthorized if the user does not have edit permission on the associated funder', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.VIEW,
				createdBy: systemUser.keycloakUserId,
			});
			await createOrUpdateUserFunderPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.MANAGE,
				createdBy: systemUser.keycloakUserId,
			});
			const before = await loadTableMetrics('opportunities');
			await request(app)
				.post('/opportunities')
				.type('application/json')
				.set(authHeader)
				.send({
					title: '🎆',
					funderShortCode: systemFunder.shortCode,
				})
				.expect(401);
			const after = await loadTableMetrics('opportunities');
			expect(before.count).toEqual(0);
			expect(after.count).toEqual(0);
		});

		it('returns 400 bad request when no title sent', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const result = await request(app)
				.post('/opportunities')
				.type('application/json')
				.set(authHeader)
				.send({ funderShortCode: systemFunder.shortCode })
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no funderShortCode sent', async () => {
			const result = await request(app)
				.post('/opportunities')
				.type('application/json')
				.set(authHeader)
				.send({ title: '👎' })
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});
	});
});
