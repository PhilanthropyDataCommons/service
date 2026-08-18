import request from 'supertest';
import { app } from '../app';
import {
	createOrUpdateBaseField,
	createPermissionGrant,
	getDatabase,
	loadPermissionGrantBundle,
	loadSystemUser,
	loadTableMetrics,
} from '../database';
import { loadUnifiedAuditLogBundle } from '../database/operations/unifiedAuditLogs';
import {
	createTestBaseField,
	createTestChangemaker,
	createTestInitiative,
	createTestInitiativeFieldValue,
	createTestSource,
} from '../test/factories';
import {
	getAuthContext,
	getTestAuthContext,
	loadTestUser,
	NO_LIMIT,
	NO_OFFSET,
} from '../test/utils';
import {
	expectArray,
	expectArrayContaining,
	expectNumber,
	expectObjectContaining,
	expectTimestamp,
} from '../test/asymettricMatchers';
import {
	BaseFieldCategory,
	BaseFieldDataType,
	BaseFieldSensitivityClassification,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
} from '../types';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';

describe('/initiatives/:initiativeId/fieldValues', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/initiatives/1/fieldValues').expect(401);
		});

		it('returns 404 when the caller may not view the initiative', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);

			await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues`)
				.set(authHeader)
				.expect(404);
		});

		it('returns an empty bundle when the caller may view the initiative but not its field values', async () => {
			const db = getDatabase();
			const systemUserAuthContext = getAuthContext(
				await loadSystemUser(db, null),
			);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);
			await createTestInitiativeFieldValue(db, testUserAuthContext, {
				initiativeId: initiative.id,
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.INITIATIVE,
				initiativeId: initiative.id,
				scope: [PermissionGrantEntityType.INITIATIVE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues`)
				.set(authHeader)
				.expect(200, {
					entries: [],
					total: 0,
				});
		});

		it('returns the field values when the caller has a changemaker grant at the initiativeFieldValue scope', async () => {
			const db = getDatabase();
			const systemUserAuthContext = getAuthContext(
				await loadSystemUser(db, null),
			);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const initiative = await createTestInitiative(db, testUserAuthContext, {
				changemakerId: changemaker.id,
			});
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id },
			);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [
					PermissionGrantEntityType.INITIATIVE,
					PermissionGrantEntityType.INITIATIVE_FIELD_VALUE,
				],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const response = await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [fieldValue],
				total: 1,
			});
		});

		it('returns only the field values whose base field category matches the grant condition', async () => {
			const db = getDatabase();
			const systemUserAuthContext = getAuthContext(
				await loadSystemUser(db, null),
			);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const initiative = await createTestInitiative(db, testUserAuthContext, {
				changemakerId: changemaker.id,
			});
			const budgetBaseField = await createTestBaseField(db, null, {
				category: BaseFieldCategory.BUDGET,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const projectBaseField = await createTestBaseField(db, null, {
				category: BaseFieldCategory.PROJECT,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const budgetFieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{
					initiativeId: initiative.id,
					baseFieldShortCode: budgetBaseField.shortCode,
				},
			);
			await createTestInitiativeFieldValue(db, testUserAuthContext, {
				initiativeId: initiative.id,
				baseFieldShortCode: projectBaseField.shortCode,
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [
					PermissionGrantEntityType.INITIATIVE,
					PermissionGrantEntityType.INITIATIVE_FIELD_VALUE,
				],
				verbs: [PermissionGrantVerb.VIEW],
				conditions: {
					initiativeFieldValue: {
						property: 'baseFieldCategory',
						operator: 'in',
						value: [BaseFieldCategory.BUDGET],
					},
				},
			});

			const response = await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [budgetFieldValue],
				total: 1,
			});
		});

		it('returns values of public base fields without an initiativeFieldValue grant', async () => {
			const db = getDatabase();
			const systemUserAuthContext = getAuthContext(
				await loadSystemUser(db, null),
			);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const publicBaseField = await createTestBaseField(db, null, {
				category: BaseFieldCategory.PROJECT,
				sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
			});
			const restrictedBaseField = await createTestBaseField(db, null, {
				category: BaseFieldCategory.PROJECT,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const publicFieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{
					initiativeId: initiative.id,
					baseFieldShortCode: publicBaseField.shortCode,
				},
			);
			await createTestInitiativeFieldValue(db, testUserAuthContext, {
				initiativeId: initiative.id,
				baseFieldShortCode: restrictedBaseField.shortCode,
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.INITIATIVE,
				initiativeId: initiative.id,
				scope: [PermissionGrantEntityType.INITIATIVE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const response = await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [publicFieldValue],
				total: 1,
			});
		});

		it('returns 400 when the initiative id is not numeric', async () => {
			const response = await request(app)
				.get('/initiatives/not_a_valid_id/fieldValues')
				.set(authHeaderWithAdminRole)
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when the initiative does not exist', async () => {
			await request(app)
				.get('/initiatives/9001/fieldValues')
				.set(authHeaderWithAdminRole)
				.expect(404);
		});

		it('returns an empty bundle when the initiative has no field values', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);

			await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues`)
				.set(authHeaderWithAdminRole)
				.expect(200, {
					entries: [],
					total: 0,
				});
		});

		it('returns the field values of the specified initiative', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const otherInitiative = await createTestInitiative(
				db,
				testUserAuthContext,
			);
			const fieldValueA = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id, value: 'A' },
			);
			const fieldValueB = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id, value: 'B' },
			);
			await createTestInitiativeFieldValue(db, testUserAuthContext, {
				initiativeId: otherInitiative.id,
				value: 'Other',
			});

			const response = await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				entries: [fieldValueA, fieldValueB],
				total: 2,
			});
		});

		it('omits field values whose base field has become forbidden', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const visibleBaseField = await createTestBaseField(db, null, {
				category: BaseFieldCategory.PROJECT,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const forbiddenBaseField = await createTestBaseField(db, null, {
				category: BaseFieldCategory.PROJECT,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const visibleFieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{
					initiativeId: initiative.id,
					baseFieldShortCode: visibleBaseField.shortCode,
					value: 'Visible',
				},
			);
			await createTestInitiativeFieldValue(db, testUserAuthContext, {
				initiativeId: initiative.id,
				baseFieldShortCode: forbiddenBaseField.shortCode,
				value: 'Forbidden',
			});
			await createOrUpdateBaseField(db, null, {
				...forbiddenBaseField,
				sensitivityClassification: BaseFieldSensitivityClassification.FORBIDDEN,
			});

			const response = await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				entries: [visibleFieldValue],
				total: 1,
			});
		});
	});

	describe('GET /:fieldValueId', () => {
		it('requires authentication', async () => {
			await request(app).get('/initiatives/1/fieldValues/1').expect(401);
		});

		it('returns 404 when the caller has no view permission', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id },
			);

			await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.set(authHeader)
				.expect(404);
		});

		it('returns the field value when the caller has a direct grant on it', async () => {
			const db = getDatabase();
			const systemUserAuthContext = getAuthContext(
				await loadSystemUser(db, null),
			);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id },
			);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.INITIATIVE_FIELD_VALUE,
				initiativeFieldValueId: fieldValue.id,
				scope: [PermissionGrantEntityType.INITIATIVE_FIELD_VALUE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const response = await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual(fieldValue);
		});

		it('returns 404 when the grant condition excludes the base field category', async () => {
			const db = getDatabase();
			const systemUserAuthContext = getAuthContext(
				await loadSystemUser(db, null),
			);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const projectBaseField = await createTestBaseField(db, null, {
				category: BaseFieldCategory.PROJECT,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{
					initiativeId: initiative.id,
					baseFieldShortCode: projectBaseField.shortCode,
				},
			);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.INITIATIVE_FIELD_VALUE,
				initiativeFieldValueId: fieldValue.id,
				scope: [PermissionGrantEntityType.INITIATIVE_FIELD_VALUE],
				verbs: [PermissionGrantVerb.VIEW],
				conditions: {
					initiativeFieldValue: {
						property: 'baseFieldCategory',
						operator: 'in',
						value: [BaseFieldCategory.BUDGET],
					},
				},
			});

			await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.set(authHeader)
				.expect(404);
		});

		it('returns the field value when the caller has an initiative grant at the initiativeFieldValue scope', async () => {
			const db = getDatabase();
			const systemUserAuthContext = getAuthContext(
				await loadSystemUser(db, null),
			);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id },
			);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.INITIATIVE,
				initiativeId: initiative.id,
				scope: [PermissionGrantEntityType.INITIATIVE_FIELD_VALUE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const response = await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual(fieldValue);
		});

		it('returns a value of a public base field to any authenticated caller', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const baseField = await createTestBaseField(db, null, {
				category: BaseFieldCategory.PROJECT,
				sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
			});
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{
					initiativeId: initiative.id,
					baseFieldShortCode: baseField.shortCode,
				},
			);

			const response = await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual(fieldValue);
		});

		it('returns 400 when the field value id is not numeric', async () => {
			const response = await request(app)
				.get('/initiatives/1/fieldValues/not_a_valid_id')
				.set(authHeaderWithAdminRole)
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when the field value does not exist', async () => {
			await request(app)
				.get('/initiatives/9001/fieldValues/9001')
				.set(authHeaderWithAdminRole)
				.expect(404);
		});

		it('returns 404 when the field value belongs to a different initiative', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const otherInitiative = await createTestInitiative(
				db,
				testUserAuthContext,
			);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: otherInitiative.id },
			);

			await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.set(authHeaderWithAdminRole)
				.expect(404);
		});

		it('returns the field value', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id },
			);

			const response = await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual(fieldValue);
		});

		it('returns 404 when the base field has become forbidden', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const baseField = await createTestBaseField(db, null, {
				category: BaseFieldCategory.PROJECT,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{
					initiativeId: initiative.id,
					baseFieldShortCode: baseField.shortCode,
				},
			);
			await createOrUpdateBaseField(db, null, {
				...baseField,
				sensitivityClassification: BaseFieldSensitivityClassification.FORBIDDEN,
			});

			await request(app)
				.get(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.set(authHeaderWithAdminRole)
				.expect(404);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/initiatives/1/fieldValues').expect(401);
		});

		it('returns 403 when the caller lacks create | initiativeFieldValue on the initiative', async () => {
			const db = getDatabase();
			const systemUserAuthContext = getAuthContext(
				await loadSystemUser(db, null),
			);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const baseField = await createTestBaseField(db, testUserAuthContext, {
				category: BaseFieldCategory.PROJECT,
			});
			const source = await createTestSource(db, testUserAuthContext);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.INITIATIVE,
				initiativeId: initiative.id,
				scope: [PermissionGrantEntityType.INITIATIVE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const before = await loadTableMetrics(db, 'initiative_field_values');
			await request(app)
				.post(`/initiatives/${initiative.id}/fieldValues`)
				.type('application/json')
				.set(authHeader)
				.send({
					baseFieldShortCode: baseField.shortCode,
					sourceId: source.id,
					value: 'A clean water program.',
					goodAsOf: null,
				})
				.expect(403);
			const after = await loadTableMetrics(db, 'initiative_field_values');

			expect(after.count).toEqual(before.count);
		});

		it('returns 403 when the caller may not reference the source', async () => {
			const db = getDatabase();
			const systemUserAuthContext = getAuthContext(
				await loadSystemUser(db, null),
			);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const initiative = await createTestInitiative(db, testUserAuthContext, {
				changemakerId: changemaker.id,
			});
			const baseField = await createTestBaseField(db, testUserAuthContext, {
				category: BaseFieldCategory.PROJECT,
			});
			const source = await createTestSource(db, testUserAuthContext);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [
					PermissionGrantEntityType.INITIATIVE,
					PermissionGrantEntityType.INITIATIVE_FIELD_VALUE,
				],
				verbs: [PermissionGrantVerb.VIEW, PermissionGrantVerb.CREATE],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.SOURCE,
				sourceId: source.id,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const before = await loadTableMetrics(db, 'initiative_field_values');
			await request(app)
				.post(`/initiatives/${initiative.id}/fieldValues`)
				.type('application/json')
				.set(authHeader)
				.send({
					baseFieldShortCode: baseField.shortCode,
					sourceId: source.id,
					value: 'A clean water program.',
					goodAsOf: null,
				})
				.expect(403);
			const after = await loadTableMetrics(db, 'initiative_field_values');

			expect(after.count).toEqual(before.count);
		});

		it('creates a field value when the caller has create | initiativeFieldValue on the changemaker', async () => {
			const db = getDatabase();
			const systemUserAuthContext = getAuthContext(
				await loadSystemUser(db, null),
			);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const initiative = await createTestInitiative(db, testUserAuthContext, {
				changemakerId: changemaker.id,
			});
			const baseField = await createTestBaseField(db, testUserAuthContext, {
				category: BaseFieldCategory.PROJECT,
			});
			const source = await createTestSource(db, testUserAuthContext);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [
					PermissionGrantEntityType.INITIATIVE,
					PermissionGrantEntityType.INITIATIVE_FIELD_VALUE,
				],
				verbs: [PermissionGrantVerb.VIEW, PermissionGrantVerb.CREATE],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.SOURCE,
				sourceId: source.id,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.REFERENCE],
			});

			const response = await request(app)
				.post(`/initiatives/${initiative.id}/fieldValues`)
				.type('application/json')
				.set(authHeader)
				.send({
					baseFieldShortCode: baseField.shortCode,
					sourceId: source.id,
					value: 'A clean water program.',
					goodAsOf: null,
				})
				.expect(201);
			expect(response.body).toMatchObject({
				initiativeId: initiative.id,
				baseFieldShortCode: baseField.shortCode,
				sourceId: source.id,
				value: 'A clean water program.',
				createdBy: testUser.keycloakUserId,
			});
		});

		it('returns 403 when the grant condition excludes the base field category', async () => {
			const db = getDatabase();
			const systemUserAuthContext = getAuthContext(
				await loadSystemUser(db, null),
			);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const initiative = await createTestInitiative(db, testUserAuthContext, {
				changemakerId: changemaker.id,
			});
			const baseField = await createTestBaseField(db, testUserAuthContext, {
				category: BaseFieldCategory.PROJECT,
			});
			const source = await createTestSource(db, testUserAuthContext);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [
					PermissionGrantEntityType.INITIATIVE,
					PermissionGrantEntityType.INITIATIVE_FIELD_VALUE,
				],
				verbs: [PermissionGrantVerb.VIEW, PermissionGrantVerb.CREATE],
				conditions: {
					initiativeFieldValue: {
						property: 'baseFieldCategory',
						operator: 'in',
						value: [BaseFieldCategory.BUDGET],
					},
				},
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.SOURCE,
				sourceId: source.id,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.REFERENCE],
			});

			const before = await loadTableMetrics(db, 'initiative_field_values');
			await request(app)
				.post(`/initiatives/${initiative.id}/fieldValues`)
				.type('application/json')
				.set(authHeader)
				.send({
					baseFieldShortCode: baseField.shortCode,
					sourceId: source.id,
					value: 'A clean water program.',
					goodAsOf: null,
				})
				.expect(403);
			const after = await loadTableMetrics(db, 'initiative_field_values');

			expect(after.count).toEqual(before.count);
		});

		it('creates a field value whose base field category matches the grant condition', async () => {
			const db = getDatabase();
			const systemUserAuthContext = getAuthContext(
				await loadSystemUser(db, null),
			);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const initiative = await createTestInitiative(db, testUserAuthContext, {
				changemakerId: changemaker.id,
			});
			const baseField = await createTestBaseField(db, testUserAuthContext, {
				category: BaseFieldCategory.BUDGET,
			});
			const source = await createTestSource(db, testUserAuthContext);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [
					PermissionGrantEntityType.INITIATIVE,
					PermissionGrantEntityType.INITIATIVE_FIELD_VALUE,
				],
				verbs: [PermissionGrantVerb.VIEW, PermissionGrantVerb.CREATE],
				conditions: {
					initiativeFieldValue: {
						property: 'baseFieldCategory',
						operator: 'in',
						value: [BaseFieldCategory.BUDGET],
					},
				},
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.SOURCE,
				sourceId: source.id,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.REFERENCE],
			});

			const response = await request(app)
				.post(`/initiatives/${initiative.id}/fieldValues`)
				.type('application/json')
				.set(authHeader)
				.send({
					baseFieldShortCode: baseField.shortCode,
					sourceId: source.id,
					value: '$50,000',
					goodAsOf: null,
				})
				.expect(201);
			expect(response.body).toMatchObject({
				initiativeId: initiative.id,
				baseFieldShortCode: baseField.shortCode,
				value: '$50,000',
			});
		});

		it('grants the creator a manage permission on the new field value', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const baseField = await createTestBaseField(db, testUserAuthContext, {
				category: BaseFieldCategory.PROJECT,
			});
			const source = await createTestSource(db, testUserAuthContext);

			await request(app)
				.post(`/initiatives/${initiative.id}/fieldValues`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					baseFieldShortCode: baseField.shortCode,
					sourceId: source.id,
					value: 'A clean water program.',
					goodAsOf: null,
				})
				.expect(201);

			const grants = await loadPermissionGrantBundle(
				db,
				getAuthContext(systemUser, true),
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				NO_LIMIT,
				NO_OFFSET,
			);
			expect(grants.entries).toEqual(
				expectArrayContaining([
					expectObjectContaining({
						granteeType: 'user',
						granteeUserKeycloakUserId: testUser.keycloakUserId,
						contextEntityType: 'initiativeFieldValue',
						initiativeFieldValueId: expectNumber(),
						scope: ['any'],
						verbs: ['manage'],
					}),
				]),
			);
		});

		it('returns 400 when the value is missing', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const baseField = await createTestBaseField(db, testUserAuthContext, {
				category: BaseFieldCategory.PROJECT,
			});
			const source = await createTestSource(db, testUserAuthContext);

			const response = await request(app)
				.post(`/initiatives/${initiative.id}/fieldValues`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					baseFieldShortCode: baseField.shortCode,
					sourceId: source.id,
					goodAsOf: null,
				})
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when the initiative does not exist', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const baseField = await createTestBaseField(db, testUserAuthContext, {
				category: BaseFieldCategory.PROJECT,
			});
			const source = await createTestSource(db, testUserAuthContext);

			await request(app)
				.post('/initiatives/9001/fieldValues')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					baseFieldShortCode: baseField.shortCode,
					sourceId: source.id,
					value: 'A clean water program.',
					goodAsOf: null,
				})
				.expect(404);
		});

		it('returns 404 when the base field does not exist', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const source = await createTestSource(db, testUserAuthContext);

			await request(app)
				.post(`/initiatives/${initiative.id}/fieldValues`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					baseFieldShortCode: 'not_a_real_base_field',
					sourceId: source.id,
					value: 'A clean water program.',
					goodAsOf: null,
				})
				.expect(404);
		});

		it('returns 404 when the source does not exist', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const baseField = await createTestBaseField(db, testUserAuthContext, {
				category: BaseFieldCategory.PROJECT,
			});

			await request(app)
				.post(`/initiatives/${initiative.id}/fieldValues`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					baseFieldShortCode: baseField.shortCode,
					sourceId: 9001,
					value: 'A clean water program.',
					goodAsOf: null,
				})
				.expect(404);
		});

		it('returns 422 when the base field is an organization field', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const baseField = await createTestBaseField(db, testUserAuthContext, {
				category: BaseFieldCategory.ORGANIZATION,
			});
			const source = await createTestSource(db, testUserAuthContext);

			const response = await request(app)
				.post(`/initiatives/${initiative.id}/fieldValues`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					baseFieldShortCode: baseField.shortCode,
					sourceId: source.id,
					value: 'A clean water program.',
					goodAsOf: null,
				})
				.expect(422);
			expect(response.body).toMatchObject({
				name: 'UnprocessableEntityError',
			});
		});

		it('accepts base field categories other than project and organization', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const baseField = await createTestBaseField(db, testUserAuthContext, {
				category: BaseFieldCategory.OUTCOMES,
			});
			const source = await createTestSource(db, testUserAuthContext);

			const response = await request(app)
				.post(`/initiatives/${initiative.id}/fieldValues`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					baseFieldShortCode: baseField.shortCode,
					sourceId: source.id,
					value: 'Two thousand households served.',
					goodAsOf: null,
				})
				.expect(201);
			expect(response.body).toMatchObject({
				baseFieldShortCode: baseField.shortCode,
				value: 'Two thousand households served.',
			});
		});

		it('returns 422 when the base field is forbidden', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const baseField = await createTestBaseField(db, testUserAuthContext, {
				category: BaseFieldCategory.PROJECT,
				sensitivityClassification: BaseFieldSensitivityClassification.FORBIDDEN,
			});
			const source = await createTestSource(db, testUserAuthContext);

			const response = await request(app)
				.post(`/initiatives/${initiative.id}/fieldValues`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					baseFieldShortCode: baseField.shortCode,
					sourceId: source.id,
					value: 'A clean water program.',
					goodAsOf: null,
				})
				.expect(422);
			expect(response.body).toMatchObject({
				name: 'UnprocessableEntityError',
			});
		});

		it('creates exactly one initiative field value', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const baseField = await createTestBaseField(db, testUserAuthContext, {
				category: BaseFieldCategory.PROJECT,
			});
			const source = await createTestSource(db, testUserAuthContext);

			const before = await loadTableMetrics(db, 'initiative_field_values');
			const response = await request(app)
				.post(`/initiatives/${initiative.id}/fieldValues`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					baseFieldShortCode: baseField.shortCode,
					sourceId: source.id,
					value: 'A clean water program.',
					goodAsOf: null,
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'initiative_field_values');

			expect(after.count).toEqual(before.count + 1);
			expect(response.body).toMatchObject({
				initiativeId: initiative.id,
				baseFieldShortCode: baseField.shortCode,
				baseField: expectObjectContaining({
					shortCode: baseField.shortCode,
				}),
				sourceId: source.id,
				source: expectObjectContaining({ id: source.id }),
				value: 'A clean water program.',
				file: null,
				goodAsOf: null,
				isValid: true,
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
		});

		it('marks a value that does not match the base field data type as invalid', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const baseField = await createTestBaseField(db, testUserAuthContext, {
				category: BaseFieldCategory.PROJECT,
				dataType: BaseFieldDataType.NUMBER,
			});
			const source = await createTestSource(db, testUserAuthContext);

			const response = await request(app)
				.post(`/initiatives/${initiative.id}/fieldValues`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					baseFieldShortCode: baseField.shortCode,
					sourceId: source.id,
					value: 'not a number',
					goodAsOf: null,
				})
				.expect(201);
			expect(response.body).toMatchObject({
				value: 'not a number',
				isValid: false,
			});
		});
	});

	describe('PATCH /:fieldValueId', () => {
		it('requires authentication', async () => {
			await request(app).patch('/initiatives/1/fieldValues/1').expect(401);
		});

		it('returns 404 when the caller may not view the field value', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id },
			);

			await request(app)
				.patch(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.type('application/json')
				.set(authHeader)
				.send({ value: 'An updated value.' })
				.expect(404);
		});

		it('returns 403 when the caller may view but not edit the field value', async () => {
			const db = getDatabase();
			const systemUserAuthContext = getAuthContext(
				await loadSystemUser(db, null),
			);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id, value: 'The original value.' },
			);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.INITIATIVE_FIELD_VALUE,
				initiativeFieldValueId: fieldValue.id,
				scope: [PermissionGrantEntityType.INITIATIVE_FIELD_VALUE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			await request(app)
				.patch(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.type('application/json')
				.set(authHeader)
				.send({ value: 'An updated value.' })
				.expect(403);
		});

		it('updates the value when the caller has an initiative grant at the initiativeFieldValue scope', async () => {
			const db = getDatabase();
			const systemUserAuthContext = getAuthContext(
				await loadSystemUser(db, null),
			);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id, value: 'The original value.' },
			);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.INITIATIVE,
				initiativeId: initiative.id,
				scope: [PermissionGrantEntityType.INITIATIVE_FIELD_VALUE],
				verbs: [PermissionGrantVerb.VIEW, PermissionGrantVerb.EDIT],
			});

			const response = await request(app)
				.patch(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.type('application/json')
				.set(authHeader)
				.send({ value: 'An updated value.' })
				.expect(200);
			expect(response.body).toEqual({
				...fieldValue,
				value: 'An updated value.',
			});
		});

		it('returns 403 when the caller may not reference the new source', async () => {
			const db = getDatabase();
			const systemUserAuthContext = getAuthContext(
				await loadSystemUser(db, null),
			);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id },
			);
			const newSource = await createTestSource(db, testUserAuthContext);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.INITIATIVE,
				initiativeId: initiative.id,
				scope: [PermissionGrantEntityType.INITIATIVE_FIELD_VALUE],
				verbs: [PermissionGrantVerb.VIEW, PermissionGrantVerb.EDIT],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.SOURCE,
				sourceId: newSource.id,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			await request(app)
				.patch(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.type('application/json')
				.set(authHeader)
				.send({ sourceId: newSource.id })
				.expect(403);
		});

		it('returns 400 when the body is empty', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id },
			);

			const response = await request(app)
				.patch(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
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
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id },
			);

			const response = await request(app)
				.patch(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ baseFieldShortCode: 'a_different_base_field' })
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when the field value does not exist', async () => {
			await request(app)
				.patch('/initiatives/9001/fieldValues/9001')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ value: 'An updated value.' })
				.expect(404);
		});

		it('returns 404 when the field value belongs to a different initiative', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const otherInitiative = await createTestInitiative(
				db,
				testUserAuthContext,
			);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: otherInitiative.id },
			);

			await request(app)
				.patch(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ value: 'An updated value.' })
				.expect(404);
		});

		it('returns 404 when the new source does not exist', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id },
			);

			await request(app)
				.patch(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ sourceId: 9001 })
				.expect(404);
		});

		it('updates the value', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id, value: 'The original value.' },
			);

			const response = await request(app)
				.patch(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ value: 'An updated value.' })
				.expect(200);
			expect(response.body).toEqual({
				...fieldValue,
				value: 'An updated value.',
			});
		});

		it('updates goodAsOf and the source', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id, goodAsOf: null },
			);
			const newSource = await createTestSource(db, testUserAuthContext);

			const response = await request(app)
				.patch(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					sourceId: newSource.id,
					goodAsOf: '2026-08-13T00:00:00.000Z',
				})
				.expect(200);
			expect(response.body).toMatchObject({
				sourceId: newSource.id,
				source: expectObjectContaining({ id: newSource.id }),
				goodAsOf: expectTimestamp(),
			});
		});

		it('revalidates the value against the base field data type', async () => {
			const db = getDatabase();
			const testUserAuthContext = getAuthContext(await loadTestUser(db));
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const baseField = await createTestBaseField(db, testUserAuthContext, {
				category: BaseFieldCategory.PROJECT,
				dataType: BaseFieldDataType.NUMBER,
			});
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{
					initiativeId: initiative.id,
					baseFieldShortCode: baseField.shortCode,
					value: '42',
				},
			);

			const response = await request(app)
				.patch(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ value: 'not a number' })
				.expect(200);
			expect(response.body).toMatchObject({
				value: 'not a number',
				isValid: false,
			});
		});

		it('records the acting user in the audit log', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const initiative = await createTestInitiative(db, testUserAuthContext);
			const fieldValue = await createTestInitiativeFieldValue(
				db,
				testUserAuthContext,
				{ initiativeId: initiative.id },
			);

			await request(app)
				.patch(`/initiatives/${initiative.id}/fieldValues/${fieldValue.id}`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({ value: 'An updated value.' })
				.expect(200);

			const auditLogs = await loadUnifiedAuditLogBundle(
				db,
				await getTestAuthContext(db),
				NO_LIMIT,
				NO_OFFSET,
			);
			expect(auditLogs.entries).toContainEqual(
				expectObjectContaining({
					operation: 'Called query initiativeFieldValues.updateById',
					userKeycloakUserId: testUser.keycloakUserId,
					userIsAdministrator: true,
				}),
			);
		});
	});
});
