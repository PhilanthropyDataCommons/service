import request from 'supertest';
import { app } from '../app';
import {
	db,
	createChangemaker,
	createOrUpdateBaseField,
	createSource,
	loadSystemSource,
} from '../database';
import { getTestUserKeycloakUserId, loadTestUser } from '../test/utils';
import { expectNumber, expectTimestamp } from '../test/asymettricMatchers';
import { createTestBaseField } from '../test/factories';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';
import {
	BaseFieldDataType,
	BaseFieldCategory,
	BaseFieldSensitivityClassification,
} from '../types';

describe('POST /changemakerFieldValues', () => {
	it('Successfully creates a changemaker field value', async () => {
		const changemaker = await createChangemaker(db, null, {
			taxId: '11-1111111',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

		const source = await createSource(db, null, {
			label: 'Test Source',
		});

		// Grant test user edit permissions
		const systemSource = await loadSystemSource(db);
		const testUser = await loadTestUser(db);
		await db.sql('userGroupChangemakerPermissions.insertOne', {
			userGroupId: testUser.userGroupId,
			changemakerId: changemaker.id,
			sourceId: systemSource.id,
			createdBy: getTestUserKeycloakUserId(),
			permission: 'edit',
		});

		const result = await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(authHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: baseField.shortCode,
				sourceId: source.id,
				value: 'Test value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(201);

		expect(result.body).toMatchObject({
			id: expectNumber(),
			changemakerId: changemaker.id,
			baseFieldShortCode: baseField.shortCode,
			sourceId: source.id,
			value: 'Test value',
			goodAsOf: '2024-01-01T00:00:00.000Z',
			isValid: true,
			createdAt: expectTimestamp(),
		});
	});

	it('Allows multiple values for same changemaker+field+source combination', async () => {
		const changemaker = await createChangemaker(db, null, {
			taxId: '22-2222222',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

		const source = await createSource(db, null, {
			label: 'Test Source',
		});

		// Grant test user edit permissions
		const systemSource = await loadSystemSource(db);
		const testUser = await loadTestUser(db);
		await db.sql('userGroupChangemakerPermissions.insertOne', {
			userGroupId: testUser.userGroupId,
			changemakerId: changemaker.id,
			sourceId: systemSource.id,
			createdBy: getTestUserKeycloakUserId(),
			permission: 'edit',
		});

		// Create first value
		await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(authHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: baseField.shortCode,
				sourceId: source.id,
				value: 'First value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(201);

		// Create second value with same changemaker+field+source
		const result = await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(authHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: baseField.shortCode,
				sourceId: source.id,
				value: 'Second value',
				goodAsOf: '2024-02-01T00:00:00Z',
			})
			.expect(201);

		expect(result.body).toMatchObject({
			value: 'Second value',
			goodAsOf: '2024-02-01T00:00:00.000Z',
		});
	});

	it('Returns 400 when request body is invalid', async () => {
		const result = await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(authHeader)
			.send({
				// Missing required fields
				value: 'Test value',
			})
			.expect(400);

		expect(result.body).toMatchObject({
			name: 'InputValidationError',
		});
	});

	it('Returns 400 when changemakerId is not an integer', async () => {
		const result = await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(authHeader)
			.send({
				changemakerId: 'not-a-number',
				baseFieldShortCode: 'test',
				sourceId: 1,
				value: 'Test value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(400);

		expect(result.body).toMatchObject({
			name: 'InputValidationError',
		});
	});

	it('Returns 400 when goodAsOf is null', async () => {
		const result = await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(authHeader)
			.send({
				changemakerId: 1,
				baseFieldShortCode: 'test',
				sourceId: 1,
				value: 'Test value',
				goodAsOf: null,
			})
			.expect(400);

		expect(result.body).toMatchObject({
			name: 'InputValidationError',
		});
	});

	it('Returns 401 when not authenticated', async () => {
		await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.send({
				changemakerId: 1,
				baseFieldShortCode: 'test',
				sourceId: 1,
				value: 'Test value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(401);
	});

	it('Returns 422 when user does not have edit permission on changemaker', async () => {
		const changemaker = await createChangemaker(db, null, {
			taxId: '33-3333333',
			name: 'Other Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

		const source = await createSource(db, null, {
			label: 'Test Source',
		});

		// No permissions granted to test user

		const result = await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(authHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: baseField.shortCode,
				sourceId: source.id,
				value: 'Test value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(422);

		expect(result.body).toMatchObject({
			name: 'UnprocessableEntityError',
			message: 'You do not have write permissions on this changemaker.',
		});
	});

	it('Returns 409 when base field does not exist', async () => {
		const changemaker = await createChangemaker(db, null, {
			taxId: '44-4444444',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const source = await createSource(db, null, {
			label: 'Test Source',
		});

		// Grant test user edit permissions
		const systemSource = await loadSystemSource(db);
		const testUser = await loadTestUser(db);
		await db.sql('userGroupChangemakerPermissions.insertOne', {
			userGroupId: testUser.userGroupId,
			changemakerId: changemaker.id,
			sourceId: systemSource.id,
			createdBy: getTestUserKeycloakUserId(),
			permission: 'edit',
		});

		const result = await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(authHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: 'nonexistent_field',
				sourceId: source.id,
				value: 'Test value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(409);

		expect(result.body).toMatchObject({
			name: 'InputConflictError',
			message: 'The base field does not exist.',
		});
	});

	it('Returns 422 when base field is not organization category', async () => {
		const changemaker = await createChangemaker(db, null, {
			taxId: '55-5555555',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const proposalField = await createOrUpdateBaseField(db, null, {
			shortCode: 'test_proposal_field',
			label: 'Test Proposal Field',
			description: 'A test field for proposals',
			category: BaseFieldCategory.PROPOSAL,
			dataType: BaseFieldDataType.STRING,
			sensitivityClassification: BaseFieldSensitivityClassification.GENERAL,
		});

		const source = await createSource(db, null, {
			label: 'Test Source',
		});

		// Grant test user edit permissions
		const systemSource = await loadSystemSource(db);
		const testUser = await loadTestUser(db);
		await db.sql('userGroupChangemakerPermissions.insertOne', {
			userGroupId: testUser.userGroupId,
			changemakerId: changemaker.id,
			sourceId: systemSource.id,
			createdBy: getTestUserKeycloakUserId(),
			permission: 'edit',
		});

		const result = await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(authHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: proposalField.shortCode,
				sourceId: source.id,
				value: 'Test value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(422);

		expect(result.body).toMatchObject({
			name: 'UnprocessableEntityError',
		});
	});

	it('Returns 422 when base field is forbidden', async () => {
		const changemaker = await createChangemaker(db, null, {
			taxId: '66-6666666',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const forbiddenField = await createOrUpdateBaseField(db, null, {
			shortCode: 'forbidden_field_test',
			label: 'Forbidden Field',
			description: 'A forbidden field',
			category: BaseFieldCategory.ORGANIZATION,
			dataType: BaseFieldDataType.STRING,
			sensitivityClassification: BaseFieldSensitivityClassification.FORBIDDEN,
		});

		const source = await createSource(db, null, {
			label: 'Test Source',
		});

		// Grant test user edit permissions
		const systemSource = await loadSystemSource(db);
		const testUser = await loadTestUser(db);
		await db.sql('userGroupChangemakerPermissions.insertOne', {
			userGroupId: testUser.userGroupId,
			changemakerId: changemaker.id,
			sourceId: systemSource.id,
			createdBy: getTestUserKeycloakUserId(),
			permission: 'edit',
		});

		const result = await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(authHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: forbiddenField.shortCode,
				sourceId: source.id,
				value: 'Test value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(422);

		expect(result.body).toMatchObject({
			name: 'UnprocessableEntityError',
		});
	});

	it('Returns 409 when source does not exist', async () => {
		const changemaker = await createChangemaker(db, null, {
			taxId: '77-7777777',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

		// Grant test user edit permissions
		const systemSource = await loadSystemSource(db);
		const testUser = await loadTestUser(db);
		await db.sql('userGroupChangemakerPermissions.insertOne', {
			userGroupId: testUser.userGroupId,
			changemakerId: changemaker.id,
			sourceId: systemSource.id,
			createdBy: getTestUserKeycloakUserId(),
			permission: 'edit',
		});

		const result = await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(authHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: baseField.shortCode,
				sourceId: 99999,
				value: 'Test value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(409);

		expect(result.body).toMatchObject({
			name: 'InputConflictError',
			message: 'The source does not exist.',
		});
	});

	it('Returns 409 when changemaker does not exist', async () => {
		const baseField = await createTestBaseField(db, null);

		const source = await createSource(db, null, {
			label: 'Test Source',
		});

		const result = await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				changemakerId: 99999,
				baseFieldShortCode: baseField.shortCode,
				sourceId: source.id,
				value: 'Test value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(409);

		expect(result.body).toMatchObject({
			name: 'InputConflictError',
			message: 'The changemaker does not exist.',
		});
	});
});
