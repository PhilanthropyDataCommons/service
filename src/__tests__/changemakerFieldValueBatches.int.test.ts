import request from 'supertest';
import { app } from '../app';
import {
	db,
	createChangemaker,
	createChangemakerFieldValueBatch,
	createOrUpdateUser,
	createSource,
} from '../database';
import { expectNumber, expectTimestamp } from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { getAuthContext, loadTestUser } from '../test/utils';

describe('POST /changemakerFieldValueBatches', () => {
	it('Successfully creates a changemaker field value batch', async () => {
		const changemaker = await createChangemaker(db, null, {
			taxId: '11-1111111',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const source = await createSource(db, null, {
			label: 'Test Source',
			changemakerId: changemaker.id,
		});

		const result = await request(app)
			.post('/changemakerFieldValueBatches')
			.type('application/json')
			.set(authHeader)
			.send({
				sourceId: source.id,
				notes: 'Routine annual import',
			})
			.expect(201);

		expect(result.body).toMatchObject({
			id: expectNumber(),
			sourceId: source.id,
			notes: 'Routine annual import',
			createdAt: expectTimestamp(),
			source: {
				id: source.id,
				label: 'Test Source',
			},
		});
	});

	it('Accepts null for notes', async () => {
		const changemaker = await createChangemaker(db, null, {
			taxId: '22-2222222',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const source = await createSource(db, null, {
			label: 'Test Source',
			changemakerId: changemaker.id,
		});

		const result = await request(app)
			.post('/changemakerFieldValueBatches')
			.type('application/json')
			.set(authHeader)
			.send({
				sourceId: source.id,
				notes: null,
			})
			.expect(201);

		expect(result.body).toMatchObject({
			id: expectNumber(),
			sourceId: source.id,
			notes: null,
			createdAt: expectTimestamp(),
		});
	});

	it('Returns 400 when request body is invalid', async () => {
		const result = await request(app)
			.post('/changemakerFieldValueBatches')
			.type('application/json')
			.set(authHeader)
			.send({
				// Missing required sourceId
				notes: 'Test notes',
			})
			.expect(400);

		expect(result.body).toMatchObject({
			name: 'InputValidationError',
		});
	});

	it('Returns 400 when sourceId is not an integer', async () => {
		const result = await request(app)
			.post('/changemakerFieldValueBatches')
			.type('application/json')
			.set(authHeader)
			.send({
				sourceId: 'not-a-number',
				notes: 'Test notes',
			})
			.expect(400);

		expect(result.body).toMatchObject({
			name: 'InputValidationError',
		});
	});

	it('Returns 401 when not authenticated', async () => {
		await request(app)
			.post('/changemakerFieldValueBatches')
			.type('application/json')
			.send({
				sourceId: 1,
				notes: 'Test notes',
			})
			.expect(401);
	});

	it('Returns 409 when source does not exist', async () => {
		const result = await request(app)
			.post('/changemakerFieldValueBatches')
			.type('application/json')
			.set(authHeader)
			.send({
				sourceId: 999999,
				notes: 'Test notes',
			})
			.expect(409);

		expect(result.body).toMatchObject({
			name: 'InputConflictError',
			message: 'The source does not exist.',
		});
	});
});

describe('GET /changemakerFieldValueBatches', () => {
	it('Returns paginated batches owned by the current user', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser);

		const changemaker = await createChangemaker(db, null, {
			taxId: '33-3333333',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const source = await createSource(db, null, {
			label: 'Test Source',
			changemakerId: changemaker.id,
		});

		const firstBatch = await createChangemakerFieldValueBatch(
			db,
			testUserAuthContext,
			{
				sourceId: source.id,
				notes: 'First batch',
			},
		);

		const secondBatch = await createChangemakerFieldValueBatch(
			db,
			testUserAuthContext,
			{
				sourceId: source.id,
				notes: 'Second batch',
			},
		);

		const result = await request(app)
			.get('/changemakerFieldValueBatches')
			.set(authHeader)
			.expect(200);

		expect(result.body).toStrictEqual({
			total: 2,
			entries: [secondBatch, firstBatch],
		});
	});

	it('Returns only batches owned by the current user', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser);
		const anotherUser = await createOrUpdateUser(db, null, {
			keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			keycloakUserName: 'Larry',
		});
		const anotherUserAuthContext = getAuthContext(anotherUser);

		const changemaker = await createChangemaker(db, null, {
			taxId: '55-5555555',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const source = await createSource(db, null, {
			label: 'Test Source',
			changemakerId: changemaker.id,
		});

		const testUserBatch = await createChangemakerFieldValueBatch(
			db,
			testUserAuthContext,
			{
				sourceId: source.id,
				notes: 'Test user batch',
			},
		);

		await createChangemakerFieldValueBatch(db, anotherUserAuthContext, {
			sourceId: source.id,
			notes: 'Another user batch',
		});

		const result = await request(app)
			.get('/changemakerFieldValueBatches')
			.set(authHeader)
			.expect(200);

		expect(result.body).toStrictEqual({
			total: 2,
			entries: [testUserBatch],
		});
	});

	it('Returns all batches when user is an administrator', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser);
		const anotherUser = await createOrUpdateUser(db, null, {
			keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			keycloakUserName: 'Martin',
		});
		const anotherUserAuthContext = getAuthContext(anotherUser);

		const changemaker = await createChangemaker(db, null, {
			taxId: '66-6666666',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const source = await createSource(db, null, {
			label: 'Test Source',
			changemakerId: changemaker.id,
		});

		const testUserBatch = await createChangemakerFieldValueBatch(
			db,
			testUserAuthContext,
			{
				sourceId: source.id,
				notes: 'Test user batch',
			},
		);

		const anotherUserBatch = await createChangemakerFieldValueBatch(
			db,
			anotherUserAuthContext,
			{
				sourceId: source.id,
				notes: 'Another user batch',
			},
		);

		const result = await request(app)
			.get('/changemakerFieldValueBatches')
			.set(authHeaderWithAdminRole)
			.expect(200);

		expect(result.body).toStrictEqual({
			total: 2,
			entries: [anotherUserBatch, testUserBatch],
		});
	});

	it('Returns 401 when not authenticated', async () => {
		await request(app).get('/changemakerFieldValueBatches').expect(401);
	});
});

describe('GET /changemakerFieldValueBatches/:batchId', () => {
	it('Returns a specific batch owned by the current user', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser);

		const changemaker = await createChangemaker(db, null, {
			taxId: '44-4444444',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const source = await createSource(db, null, {
			label: 'Test Source',
			changemakerId: changemaker.id,
		});

		const batch = await createChangemakerFieldValueBatch(
			db,
			testUserAuthContext,
			{
				sourceId: source.id,
				notes: 'Test batch',
			},
		);

		const result = await request(app)
			.get(`/changemakerFieldValueBatches/${batch.id}`)
			.set(authHeader)
			.expect(200);

		expect(result.body).toStrictEqual(batch);
	});

	it('Returns 404 when batch belongs to another user', async () => {
		const anotherUser = await createOrUpdateUser(db, null, {
			keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			keycloakUserName: 'Nancy',
		});
		const anotherUserAuthContext = getAuthContext(anotherUser);

		const changemaker = await createChangemaker(db, null, {
			taxId: '77-7777777',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const source = await createSource(db, null, {
			label: 'Test Source',
			changemakerId: changemaker.id,
		});

		const batch = await createChangemakerFieldValueBatch(
			db,
			anotherUserAuthContext,
			{
				sourceId: source.id,
				notes: 'Another user batch',
			},
		);

		const result = await request(app)
			.get(`/changemakerFieldValueBatches/${batch.id}`)
			.set(authHeader)
			.expect(404);

		expect(result.body).toMatchObject({
			name: 'NotFoundError',
		});
	});

	it('Returns another users batch when user is an administrator', async () => {
		const anotherUser = await createOrUpdateUser(db, null, {
			keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			keycloakUserName: 'Oscar',
		});
		const anotherUserAuthContext = getAuthContext(anotherUser);

		const changemaker = await createChangemaker(db, null, {
			taxId: '88-8888888',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const source = await createSource(db, null, {
			label: 'Test Source',
			changemakerId: changemaker.id,
		});

		const batch = await createChangemakerFieldValueBatch(
			db,
			anotherUserAuthContext,
			{
				sourceId: source.id,
				notes: 'Another user batch',
			},
		);

		const result = await request(app)
			.get(`/changemakerFieldValueBatches/${batch.id}`)
			.set(authHeaderWithAdminRole)
			.expect(200);

		expect(result.body).toStrictEqual(batch);
	});

	it('Returns 404 when batch does not exist', async () => {
		const result = await request(app)
			.get('/changemakerFieldValueBatches/999999')
			.set(authHeader)
			.expect(404);

		expect(result.body).toMatchObject({
			name: 'NotFoundError',
		});
	});

	it('Returns 400 when batchId is not a valid integer', async () => {
		const result = await request(app)
			.get('/changemakerFieldValueBatches/not-a-number')
			.set(authHeader)
			.expect(400);

		expect(result.body).toMatchObject({
			name: 'InputValidationError',
		});
	});

	it('Returns 401 when not authenticated', async () => {
		await request(app).get('/changemakerFieldValueBatches/1').expect(401);
	});
});
