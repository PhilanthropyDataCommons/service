import request from 'supertest';
import { app } from '../app';
import {
	db,
	createChangemaker,
	createOrUpdateDataProvider,
	createOrUpdateFunder,
	createSource,
	loadSystemSource,
	loadTableMetrics,
	loadSystemUser,
	createOrUpdateUserChangemakerPermission,
	createOrUpdateUserFunderPermission,
	createOrUpdateUserDataProviderPermission,
} from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';
import { Permission } from '../types';

const agent = request.agent(app);

describe('/sources', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/sources').expect(401);
		});

		it('returns the system source when no data has been added', async () => {
			const systemSource = await loadSystemSource(db, null);
			await agent
				.get('/sources')
				.set(authHeader)
				.expect(200, {
					entries: [systemSource],
					total: 1,
				});
		});

		it('returns all sources present in the database', async () => {
			const systemSource = await loadSystemSource(db, null);
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const source = await createSource(db, null, {
				label: 'Example Inc.',
				changemakerId: changemaker.id,
			});
			const response = await agent.get('/sources').set(authHeader).expect(200);
			expect(response.body).toEqual({
				entries: [source, systemSource],
				total: 2,
			});
		});
	});

	describe('GET /:id', () => {
		it('requires authentication', async () => {
			await agent.get('/sources/1').expect(401);
		});

		it('returns exactly one source selected by id', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const source = await createSource(db, null, {
				label: 'Example Inc.',
				changemakerId: changemaker.id,
			});

			const response = await agent
				.get(`/sources/${source.id}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual(source);
		});

		it('returns 400 bad request when id is a letter', async () => {
			const result = await agent.get('/sources/a').set(authHeader).expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when id is a number greater than 2^32-1', async () => {
			const result = await agent
				.get('/sources/555555555555555555555555555555')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 404 when id is not found', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createSource(db, null, {
				label: 'not to be returned',
				changemakerId: changemaker.id,
			});
			await agent.get('/sources/9001').set(authHeader).expect(404);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await agent.post('/sources').expect(401);
		});

		it('creates and returns exactly one changemaker source for an admin user', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const before = await loadTableMetrics('sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Example Corp',
					changemakerId: changemaker.id,
				})
				.expect(201);
			const after = await loadTableMetrics('sources');
			expect(before.count).toEqual(1);
			expect(result.body).toMatchObject({
				id: 2,
				label: 'Example Corp',
				changemakerId: changemaker.id,
				changemaker,
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(2);
		});

		it('creates and returns exactly one changemaker source for a user with edit permissions on that changemaker', async () => {
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser();
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserChangemakerPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				changemakerId: changemaker.id,
				permission: Permission.EDIT,
				createdBy: systemUser.keycloakUserId,
			});
			const before = await loadTableMetrics('sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'Example Corp',
					changemakerId: changemaker.id,
				})
				.expect(201);
			const after = await loadTableMetrics('sources');
			expect(result.body).toMatchObject({
				id: 2,
				label: 'Example Corp',
				changemakerId: changemaker.id,
				changemaker,
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('returns 422 if the user does not have edit permission on the changemaker', async () => {
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser();
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserChangemakerPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				changemakerId: changemaker.id,
				permission: Permission.MANAGE,
				createdBy: systemUser.keycloakUserId,
			});
			await createOrUpdateUserChangemakerPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				changemakerId: changemaker.id,
				permission: Permission.VIEW,
				createdBy: systemUser.keycloakUserId,
			});
			const before = await loadTableMetrics('sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'Example Corp',
					changemakerId: changemaker.id,
				})
				.expect(422);
			const after = await loadTableMetrics('sources');
			expect(result.body).toEqual({
				details: [{ name: 'UnprocessableEntityError' }],
				message:
					'You do not have write permissions on a changemaker with the specified id.',
				name: 'UnprocessableEntityError',
			});
			expect(after.count).toEqual(before.count);
		});

		it('creates and returns exactly one funder source for an admin user', async () => {
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'foo',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const before = await loadTableMetrics('sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Example Corp',
					funderShortCode: 'foo',
				})
				.expect(201);
			const after = await loadTableMetrics('sources');
			expect(before.count).toEqual(1);
			expect(result.body).toMatchObject({
				id: 2,
				label: 'Example Corp',
				funderShortCode: 'foo',
				funder,
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(2);
		});

		it('creates and returns exactly one funder source for a user with edit permissions on that funder', async () => {
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser();
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'foo',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserFunderPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: funder.shortCode,
				permission: Permission.EDIT,
				createdBy: systemUser.keycloakUserId,
			});
			const before = await loadTableMetrics('sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'Example Corp',
					funderShortCode: 'foo',
				})
				.expect(201);
			const after = await loadTableMetrics('sources');
			expect(result.body).toMatchObject({
				id: 2,
				label: 'Example Corp',
				funderShortCode: 'foo',
				funder,
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('returns 422 if the user does not have edit permission on the funder', async () => {
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser();
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'foo',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserFunderPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: funder.shortCode,
				permission: Permission.MANAGE,
				createdBy: systemUser.keycloakUserId,
			});
			await createOrUpdateUserFunderPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: funder.shortCode,
				permission: Permission.VIEW,
				createdBy: systemUser.keycloakUserId,
			});
			const before = await loadTableMetrics('sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'Example Corp',
					funderShortCode: 'foo',
				})
				.expect(422);
			const after = await loadTableMetrics('sources');
			expect(result.body).toEqual({
				details: [{ name: 'UnprocessableEntityError' }],
				message:
					'You do not have write permissions on a funder with the specified short code.',
				name: 'UnprocessableEntityError',
			});
			expect(after.count).toEqual(before.count);
		});

		it('creates and returns exactly one data provider source for an admin user', async () => {
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'foo',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const before = await loadTableMetrics('sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Example Corp',
					dataProviderShortCode: 'foo',
				})
				.expect(201);
			const after = await loadTableMetrics('sources');
			expect(before.count).toEqual(1);
			expect(result.body).toMatchObject({
				id: 2,
				label: 'Example Corp',
				dataProviderShortCode: 'foo',
				dataProvider,
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(2);
		});

		it('creates and returns exactly one data provider source for a user with edit permissions on the data provider', async () => {
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser();
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'foo',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserDataProviderPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				dataProviderShortCode: dataProvider.shortCode,
				permission: Permission.EDIT,
				createdBy: systemUser.keycloakUserId,
			});
			const before = await loadTableMetrics('sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'Example Corp',
					dataProviderShortCode: 'foo',
				})
				.expect(201);
			const after = await loadTableMetrics('sources');
			expect(result.body).toMatchObject({
				id: 2,
				label: 'Example Corp',
				dataProviderShortCode: 'foo',
				dataProvider,
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('returns 422 if the user does not have edit permission on the data provider', async () => {
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser();
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'foo',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserDataProviderPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				dataProviderShortCode: dataProvider.shortCode,
				permission: Permission.MANAGE,
				createdBy: systemUser.keycloakUserId,
			});
			await createOrUpdateUserDataProviderPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				dataProviderShortCode: dataProvider.shortCode,
				permission: Permission.VIEW,
				createdBy: systemUser.keycloakUserId,
			});
			const before = await loadTableMetrics('sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'Example Corp',
					dataProviderShortCode: 'foo',
				})
				.expect(422);
			const after = await loadTableMetrics('sources');
			expect(result.body).toEqual({
				details: [{ name: 'UnprocessableEntityError' }],
				message:
					'You do not have write permissions on a data provider with the specified short code.',
				name: 'UnprocessableEntityError',
			});
			expect(after.count).toEqual(before.count);
		});

		it('returns 400 bad request when no label sent', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					changemakerId: changemaker.id,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no related entity is sent', async () => {
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Example Corp',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});
	});
});
