import request from 'supertest';
import { app } from '../app';
import {
	db,
	createChangemaker,
	createOrUpdateBaseField,
	createSource,
	createChangemakerFieldValueBatch,
	createChangemakerFieldValue,
	loadSystemUser,
	createOrUpdateUserChangemakerPermission,
} from '../database';
import { expectNumber, expectTimestamp } from '../test/asymettricMatchers';
import { createTestBaseField } from '../test/factories';
import { getAuthContext, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';
import {
	BaseFieldDataType,
	BaseFieldCategory,
	BaseFieldSensitivityClassification,
	Permission,
} from '../types';

describe('POST /changemakerFieldValues', () => {
	it('Successfully creates a changemaker field value', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser, true);

		const changemaker = await createChangemaker(db, null, {
			taxId: '11-1111111',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

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
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: baseField.shortCode,
				batchId: batch.id,
				value: 'Test value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(201);

		expect(result.body).toMatchObject({
			id: expectNumber(),
			changemakerId: changemaker.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: batch.id,
			value: 'Test value',
			goodAsOf: '2024-01-01T00:00:00+00:00',
			isValid: true,
			createdAt: expectTimestamp(),
		});
	});

	it('Allows multiple values for same changemaker+field+batch combination', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser, true);

		const changemaker = await createChangemaker(db, null, {
			taxId: '22-2222222',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

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

		// Create first value
		await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: baseField.shortCode,
				batchId: batch.id,
				value: 'First value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(201);

		// Create second value with same changemaker+field+batch
		const result = await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: baseField.shortCode,
				batchId: batch.id,
				value: 'Second value',
				goodAsOf: '2024-02-01T00:00:00Z',
			})
			.expect(201);

		expect(result.body).toMatchObject({
			value: 'Second value',
			goodAsOf: '2024-02-01T00:00:00+00:00',
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
				batchId: 1,
				value: 'Test value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(400);

		expect(result.body).toMatchObject({
			name: 'InputValidationError',
		});
	});

	it('Accepts null for goodAsOf', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser, true);

		const changemaker = await createChangemaker(db, null, {
			taxId: '99-9999999',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

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
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: baseField.shortCode,
				batchId: batch.id,
				value: 'Test value',
				goodAsOf: null,
			})
			.expect(201);

		expect(result.body).toMatchObject({
			id: expectNumber(),
			changemakerId: changemaker.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: batch.id,
			value: 'Test value',
			goodAsOf: null,
			isValid: true,
			createdAt: expectTimestamp(),
		});
	});

	it('Returns 401 when not authenticated', async () => {
		await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.send({
				changemakerId: 1,
				baseFieldShortCode: 'test',
				batchId: 1,
				value: 'Test value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(401);
	});

	it('Returns 422 when user does not have edit permission on changemaker', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser, true);

		const changemaker = await createChangemaker(db, null, {
			taxId: '33-3333333',
			name: 'Other Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

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

		// No permissions granted to test user

		const result = await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(authHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: baseField.shortCode,
				batchId: batch.id,
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
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser, true);

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
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: 'nonexistent_field',
				batchId: batch.id,
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
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser, true);

		const changemaker = await createChangemaker(db, null, {
			taxId: '55-5555555',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const proposalField = await createOrUpdateBaseField(db, null, {
			shortCode: 'test_proposal_field',
			label: 'Test Proposal Field',
			description: 'A test field for proposals',
			category: BaseFieldCategory.PROJECT,
			dataType: BaseFieldDataType.STRING,
			sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
			valueRelevanceHours: null,
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
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: proposalField.shortCode,
				batchId: batch.id,
				value: 'Test value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(422);

		expect(result.body).toMatchObject({
			name: 'UnprocessableEntityError',
		});
	});

	it('Returns 422 when base field is forbidden', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser, true);

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
			valueRelevanceHours: null,
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
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: forbiddenField.shortCode,
				batchId: batch.id,
				value: 'Test value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(422);

		expect(result.body).toMatchObject({
			name: 'UnprocessableEntityError',
		});
	});

	it('Returns 409 when batch does not exist', async () => {
		const changemaker = await createChangemaker(db, null, {
			taxId: '77-7777777',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

		const result = await request(app)
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				changemakerId: changemaker.id,
				baseFieldShortCode: baseField.shortCode,
				batchId: 99999,
				value: 'Test value',
				goodAsOf: '2024-01-01T00:00:00Z',
			})
			.expect(409);

		expect(result.body).toMatchObject({
			name: 'InputConflictError',
			message: 'The batch does not exist.',
		});
	});

	it('Returns 409 when changemaker does not exist', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser, true);

		const changemaker = await createChangemaker(db, null, {
			taxId: '88-8888888',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

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
			.post('/changemakerFieldValues')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				changemakerId: 99999,
				baseFieldShortCode: baseField.shortCode,
				batchId: batch.id,
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

describe('GET /changemakerFieldValues', () => {
	it('Returns paginated field values for admin user', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser, true);

		const changemaker = await createChangemaker(db, null, {
			taxId: '90-9090901',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

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

		const firstValue = await createChangemakerFieldValue(db, null, {
			changemakerId: changemaker.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: batch.id,
			value: 'First value',
			isValid: true,
			goodAsOf: '2024-01-01T00:00:00Z',
		});

		const secondValue = await createChangemakerFieldValue(db, null, {
			changemakerId: changemaker.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: batch.id,
			value: 'Second value',
			isValid: true,
			goodAsOf: '2024-02-01T00:00:00Z',
		});

		const result = await request(app)
			.get('/changemakerFieldValues')
			.set(adminUserAuthHeader)
			.expect(200);

		expect(result.body).toStrictEqual({
			total: 2,
			entries: [secondValue, firstValue],
		});
	});

	it('Only returns field values for changemakers user has view permission on', async () => {
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const testUser = await loadTestUser();

		const visibleChangemaker = await createChangemaker(db, null, {
			taxId: '90-9090910',
			name: 'Visible Organization',
			keycloakOrganizationId: null,
		});

		const hiddenChangemaker = await createChangemaker(db, null, {
			taxId: '90-9090911',
			name: 'Hidden Organization',
			keycloakOrganizationId: null,
		});

		await createOrUpdateUserChangemakerPermission(db, systemUserAuthContext, {
			userKeycloakUserId: testUser.keycloakUserId,
			changemakerId: visibleChangemaker.id,
			permission: Permission.VIEW,
		});

		const baseField = await createTestBaseField(db, null);

		const visibleSource = await createSource(db, null, {
			label: 'Visible Source',
			changemakerId: visibleChangemaker.id,
		});

		const hiddenSource = await createSource(db, null, {
			label: 'Hidden Source',
			changemakerId: hiddenChangemaker.id,
		});

		const visibleBatch = await createChangemakerFieldValueBatch(
			db,
			systemUserAuthContext,
			{
				sourceId: visibleSource.id,
				notes: 'Visible batch',
			},
		);

		const hiddenBatch = await createChangemakerFieldValueBatch(
			db,
			systemUserAuthContext,
			{
				sourceId: hiddenSource.id,
				notes: 'Hidden batch',
			},
		);

		const visibleValue = await createChangemakerFieldValue(db, null, {
			changemakerId: visibleChangemaker.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: visibleBatch.id,
			value: 'Visible value',
			isValid: true,
			goodAsOf: '2024-01-01T00:00:00Z',
		});

		await createChangemakerFieldValue(db, null, {
			changemakerId: hiddenChangemaker.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: hiddenBatch.id,
			value: 'Hidden value',
			isValid: true,
			goodAsOf: '2024-02-01T00:00:00Z',
		});

		const result = await request(app)
			.get('/changemakerFieldValues')
			.set(authHeader)
			.expect(200);

		expect(result.body).toStrictEqual({
			total: 2,
			entries: [visibleValue],
		});
	});

	it('Returns empty entries when user has no permissions', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser, true);

		const changemaker = await createChangemaker(db, null, {
			taxId: '90-9090912',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

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

		await createChangemakerFieldValue(db, null, {
			changemakerId: changemaker.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: batch.id,
			value: 'Test value',
			isValid: true,
			goodAsOf: '2024-01-01T00:00:00Z',
		});

		const result = await request(app)
			.get('/changemakerFieldValues')
			.set(authHeader)
			.expect(200);

		expect(result.body).toStrictEqual({
			total: 1,
			entries: [],
		});
	});

	it('Filters by changemakerFieldValueBatch', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser, true);

		const changemaker = await createChangemaker(db, null, {
			taxId: '90-9090902',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

		const source = await createSource(db, null, {
			label: 'Test Source',
			changemakerId: changemaker.id,
		});

		const batch1 = await createChangemakerFieldValueBatch(
			db,
			testUserAuthContext,
			{
				sourceId: source.id,
				notes: 'First batch',
			},
		);

		const batch2 = await createChangemakerFieldValueBatch(
			db,
			testUserAuthContext,
			{
				sourceId: source.id,
				notes: 'Second batch',
			},
		);

		const valueInBatch1 = await createChangemakerFieldValue(db, null, {
			changemakerId: changemaker.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: batch1.id,
			value: 'Value in batch 1',
			isValid: true,
			goodAsOf: '2024-01-01T00:00:00Z',
		});

		await createChangemakerFieldValue(db, null, {
			changemakerId: changemaker.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: batch2.id,
			value: 'Value in batch 2',
			isValid: true,
			goodAsOf: '2024-02-01T00:00:00Z',
		});

		const result = await request(app)
			.get(`/changemakerFieldValues?changemakerFieldValueBatch=${batch1.id}`)
			.set(adminUserAuthHeader)
			.expect(200);

		expect(result.body).toStrictEqual({
			total: 2,
			entries: [valueInBatch1],
		});
	});

	it('Filters by changemaker', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser, true);

		const changemaker1 = await createChangemaker(db, null, {
			taxId: '90-9090903',
			name: 'First Organization',
			keycloakOrganizationId: null,
		});

		const changemaker2 = await createChangemaker(db, null, {
			taxId: '90-9090904',
			name: 'Second Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

		const source1 = await createSource(db, null, {
			label: 'Source 1',
			changemakerId: changemaker1.id,
		});

		const source2 = await createSource(db, null, {
			label: 'Source 2',
			changemakerId: changemaker2.id,
		});

		const batch1 = await createChangemakerFieldValueBatch(
			db,
			testUserAuthContext,
			{
				sourceId: source1.id,
				notes: 'Batch 1',
			},
		);

		const batch2 = await createChangemakerFieldValueBatch(
			db,
			testUserAuthContext,
			{
				sourceId: source2.id,
				notes: 'Batch 2',
			},
		);

		const valueForChangemaker1 = await createChangemakerFieldValue(db, null, {
			changemakerId: changemaker1.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: batch1.id,
			value: 'Value for changemaker 1',
			isValid: true,
			goodAsOf: '2024-01-01T00:00:00Z',
		});

		await createChangemakerFieldValue(db, null, {
			changemakerId: changemaker2.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: batch2.id,
			value: 'Value for changemaker 2',
			isValid: true,
			goodAsOf: '2024-02-01T00:00:00Z',
		});

		const result = await request(app)
			.get(`/changemakerFieldValues?changemaker=${changemaker1.id}`)
			.set(adminUserAuthHeader)
			.expect(200);

		expect(result.body).toStrictEqual({
			total: 2,
			entries: [valueForChangemaker1],
		});
	});

	it('Filters by both changemakerFieldValueBatch and changemaker', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser, true);

		const changemaker = await createChangemaker(db, null, {
			taxId: '90-9090905',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

		const source = await createSource(db, null, {
			label: 'Test Source',
			changemakerId: changemaker.id,
		});

		const batch1 = await createChangemakerFieldValueBatch(
			db,
			testUserAuthContext,
			{
				sourceId: source.id,
				notes: 'First batch',
			},
		);

		const batch2 = await createChangemakerFieldValueBatch(
			db,
			testUserAuthContext,
			{
				sourceId: source.id,
				notes: 'Second batch',
			},
		);

		const targetValue = await createChangemakerFieldValue(db, null, {
			changemakerId: changemaker.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: batch1.id,
			value: 'Target value',
			isValid: true,
			goodAsOf: '2024-01-01T00:00:00Z',
		});

		await createChangemakerFieldValue(db, null, {
			changemakerId: changemaker.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: batch2.id,
			value: 'Other value',
			isValid: true,
			goodAsOf: '2024-02-01T00:00:00Z',
		});

		const result = await request(app)
			.get(
				`/changemakerFieldValues?changemakerFieldValueBatch=${batch1.id}&changemaker=${changemaker.id}`,
			)
			.set(adminUserAuthHeader)
			.expect(200);

		expect(result.body).toStrictEqual({
			total: 2,
			entries: [targetValue],
		});
	});

	it('Returns 400 for invalid changemakerFieldValueBatch parameter', async () => {
		const result = await request(app)
			.get('/changemakerFieldValues?changemakerFieldValueBatch=not-a-number')
			.set(authHeader)
			.expect(400);

		expect(result.body).toMatchObject({
			name: 'InputValidationError',
		});
	});

	it('Returns 401 when not authenticated', async () => {
		await request(app).get('/changemakerFieldValues').expect(401);
	});
});

describe('GET /changemakerFieldValues/:fieldValueId', () => {
	it('Returns a specific field value for admin user', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser, true);

		const changemaker = await createChangemaker(db, null, {
			taxId: '90-9090906',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

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

		const fieldValue = await createChangemakerFieldValue(db, null, {
			changemakerId: changemaker.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: batch.id,
			value: 'Test value',
			isValid: true,
			goodAsOf: '2024-01-01T00:00:00Z',
		});

		const result = await request(app)
			.get(`/changemakerFieldValues/${fieldValue.id}`)
			.set(adminUserAuthHeader)
			.expect(200);

		expect(result.body).toStrictEqual(fieldValue);
	});

	it('Returns field value when user has view permission on changemaker', async () => {
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const testUser = await loadTestUser();

		const changemaker = await createChangemaker(db, null, {
			taxId: '90-9090920',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		await createOrUpdateUserChangemakerPermission(db, systemUserAuthContext, {
			userKeycloakUserId: testUser.keycloakUserId,
			changemakerId: changemaker.id,
			permission: Permission.VIEW,
		});

		const baseField = await createTestBaseField(db, null);

		const source = await createSource(db, null, {
			label: 'Test Source',
			changemakerId: changemaker.id,
		});

		const batch = await createChangemakerFieldValueBatch(
			db,
			systemUserAuthContext,
			{
				sourceId: source.id,
				notes: 'Test batch',
			},
		);

		const fieldValue = await createChangemakerFieldValue(db, null, {
			changemakerId: changemaker.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: batch.id,
			value: 'Test value',
			isValid: true,
			goodAsOf: '2024-01-01T00:00:00Z',
		});

		const result = await request(app)
			.get(`/changemakerFieldValues/${fieldValue.id}`)
			.set(authHeader)
			.expect(200);

		expect(result.body).toStrictEqual(fieldValue);
	});

	it('Returns 404 when user lacks view permission on changemaker', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser, true);

		const changemaker = await createChangemaker(db, null, {
			taxId: '90-9090921',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const baseField = await createTestBaseField(db, null);

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

		const fieldValue = await createChangemakerFieldValue(db, null, {
			changemakerId: changemaker.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: batch.id,
			value: 'Test value',
			isValid: true,
			goodAsOf: '2024-01-01T00:00:00Z',
		});

		const result = await request(app)
			.get(`/changemakerFieldValues/${fieldValue.id}`)
			.set(authHeader)
			.expect(404);

		expect(result.body).toMatchObject({
			name: 'NotFoundError',
		});
	});

	it('Returns 404 when field value does not exist', async () => {
		const result = await request(app)
			.get('/changemakerFieldValues/999999')
			.set(adminUserAuthHeader)
			.expect(404);

		expect(result.body).toMatchObject({
			name: 'NotFoundError',
		});
	});

	it('Returns 400 when fieldValueId is not a valid integer', async () => {
		const result = await request(app)
			.get('/changemakerFieldValues/not-a-number')
			.set(authHeader)
			.expect(400);

		expect(result.body).toMatchObject({
			name: 'InputValidationError',
		});
	});

	it('Returns 401 when not authenticated', async () => {
		await request(app).get('/changemakerFieldValues/1').expect(401);
	});
});
