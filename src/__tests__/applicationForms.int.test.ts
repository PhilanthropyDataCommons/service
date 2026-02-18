import request from 'supertest';
import { app } from '../app';
import {
	createApplicationForm,
	createApplicationFormField,
	createOrUpdateBaseField,
	createPermissionGrant,
	db,
	loadSystemUser,
	loadTableMetrics,
} from '../database';
import { getLogger } from '../logger';
import { createTestFunder, createTestOpportunity } from '../test/factories';
import {
	BaseFieldDataType,
	BaseFieldCategory,
	BaseFieldSensitivityClassification,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
} from '../types';
import { getAuthContext, loadTestUser } from '../test/utils';
import { expectArray, expectTimestamp } from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';

const logger = getLogger(__filename);

const createTestBaseFields = async () => {
	await createOrUpdateBaseField(db, null, {
		label: 'Organization Name',
		description: 'The organizational name of the applicant',
		shortCode: 'organizationName',
		dataType: BaseFieldDataType.STRING,
		category: BaseFieldCategory.ORGANIZATION,
		valueRelevanceHours: null,
		sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
	});
	await createOrUpdateBaseField(db, null, {
		label: 'Years of work',
		description: 'The number of years the project will take to complete',
		shortCode: 'yearsOfWork',
		dataType: BaseFieldDataType.STRING,
		category: BaseFieldCategory.PROJECT,
		valueRelevanceHours: null,
		sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
	});
};

describe('/applicationForms', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/applicationForms').expect(401);
		});

		it('returns the system application form when no other data is present', async () => {
			const response = await request(app)
				.get('/applicationForms')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toMatchObject({
				entries: [
					{
						createdAt: expectTimestamp(),
						id: 1,
						opportunityId: 1,
						version: 1,
					},
				],
				total: 1,
			});
		});

		it('returns all application forms present in the database when the user is an administrator', async () => {
			const opportunity1 = await createTestOpportunity(db, null);
			const opportunity2 = await createTestOpportunity(db, null);
			await createApplicationForm(db, null, {
				opportunityId: opportunity1.id,
				name: null,
			});
			await createApplicationForm(db, null, {
				opportunityId: opportunity1.id,
				name: null,
			});
			await createApplicationForm(db, null, {
				opportunityId: opportunity2.id,
				name: null,
			});
			const response = await request(app)
				.get('/applicationForms')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toMatchObject({
				entries: [
					{
						createdAt: expectTimestamp(),
						id: 1,
						opportunityId: 1,
						version: 1,
					},
					{
						createdAt: expectTimestamp(),
						id: 2,
						opportunityId: opportunity1.id,
						version: 1,
					},
					{
						createdAt: expectTimestamp(),
						id: 3,
						opportunityId: opportunity1.id,
						version: 2,
					},
					{
						createdAt: expectTimestamp(),
						id: 4,
						opportunityId: opportunity2.id,
						version: 1,
					},
				],
				total: 4,
			});
		});

		it('returns only application forms that the user is allowed to view', async () => {
			const visibleFunder = await createTestFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: visibleFunder.shortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const otherFunder = await createTestFunder(db, null);
			const visibleOpportunity = await createTestOpportunity(db, null, {
				funderShortCode: visibleFunder.shortCode,
			});
			const hiddenOpportunity = await createTestOpportunity(db, null, {
				funderShortCode: otherFunder.shortCode,
			});
			const visibleApplicationForm1 = await createApplicationForm(db, null, {
				opportunityId: visibleOpportunity.id,
				name: null,
			});
			const visibleApplicationForm2 = await createApplicationForm(db, null, {
				opportunityId: visibleOpportunity.id,
				name: null,
			});
			await createApplicationForm(db, null, {
				opportunityId: hiddenOpportunity.id,
				name: null,
			});
			const response = await request(app)
				.get('/applicationForms')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [visibleApplicationForm1, visibleApplicationForm2],
				total: 4,
			});
		});
	});

	describe('GET /:applicationFormId', () => {
		it('requires authentication', async () => {
			await request(app).get('/applicationForms/6').expect(401);
		});

		it('returns an application form with its fields when the user is an administrator', async () => {
			const opportunity1 = await createTestOpportunity(db, null);
			const opportunity2 = await createTestOpportunity(db, null);
			await createApplicationForm(db, null, {
				opportunityId: opportunity1.id,
				name: null,
			});
			const applicationForm2 = await createApplicationForm(db, null, {
				opportunityId: opportunity1.id,
				name: null,
			});
			const applicationForm3 = await createApplicationForm(db, null, {
				opportunityId: opportunity2.id,
				name: null,
			});
			await createTestBaseFields();
			await createApplicationFormField(db, null, {
				applicationFormId: applicationForm3.id,
				baseFieldShortCode: 'yearsOfWork',
				position: 1,
				label: 'Anni Worki',
				instructions: 'Please enter the number of years of work.',
			});
			await createApplicationFormField(db, null, {
				applicationFormId: applicationForm3.id,
				baseFieldShortCode: 'organizationName',
				position: 2,
				label: 'Org Nomen',
				instructions: 'Please enter the name of the organization.',
			});
			await createApplicationFormField(db, null, {
				applicationFormId: applicationForm2.id,
				baseFieldShortCode: 'organizationName',
				position: 2,
				label: 'Name of Organization',
				instructions: 'Please enter the name of the organization.',
			});
			await createApplicationFormField(db, null, {
				applicationFormId: applicationForm2.id,
				baseFieldShortCode: 'yearsOfWork',
				position: 1,
				label: 'Duration of work in years',
				instructions: 'Please enter the number of years of work.',
			});
			const result = await request(app)
				.get(`/applicationForms/${applicationForm2.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200);

			expect(result.body).toMatchObject({
				id: applicationForm2.id,
				opportunityId: opportunity1.id,
				version: 2,
				fields: [
					{
						applicationFormId: applicationForm2.id,
						baseFieldShortCode: 'yearsOfWork',
						baseField: {
							label: 'Years of work',
							description:
								'The number of years the project will take to complete',
							shortCode: 'yearsOfWork',
							dataType: BaseFieldDataType.STRING,
							createdAt: expectTimestamp(),
						},
						position: 1,
						label: 'Duration of work in years',
						createdAt: expectTimestamp(),
					},
					{
						applicationFormId: applicationForm2.id,
						baseFieldShortCode: 'organizationName',
						baseField: {
							label: 'Organization Name',
							description: 'The organizational name of the applicant',
							shortCode: 'organizationName',
							dataType: BaseFieldDataType.STRING,
							createdAt: expectTimestamp(),
						},
						position: 2,
						label: 'Name of Organization',
						createdAt: expectTimestamp(),
					},
				],
				createdAt: expectTimestamp(),
			});
		});

		it('returns an application form with its fields when the user has read access to the relevant funder', async () => {
			const visibleFunder = await createTestFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: visibleFunder.shortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const opportunity = await createTestOpportunity(db, null, {
				funderShortCode: visibleFunder.shortCode,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			await createTestBaseFields();
			await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: 'organizationName',
				position: 2,
				label: 'Name of Organization',
				instructions: 'Please enter the name of the organization.',
			});
			await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: 'yearsOfWork',
				position: 1,
				label: 'Duration of work in years',
				instructions: 'Please enter the number of years of work.',
			});
			const result = await request(app)
				.get(`/applicationForms/${applicationForm.id}`)
				.set(authHeader)
				.expect(200);

			expect(result.body).toMatchObject({
				id: applicationForm.id,
				opportunityId: opportunity.id,
				version: 1,
				fields: [
					{
						applicationFormId: applicationForm.id,
						baseFieldShortCode: 'yearsOfWork',
						baseField: {
							label: 'Years of work',
							description:
								'The number of years the project will take to complete',
							shortCode: 'yearsOfWork',
							dataType: BaseFieldDataType.STRING,
							createdAt: expectTimestamp(),
						},
						position: 1,
						label: 'Duration of work in years',
						instructions: 'Please enter the number of years of work.',
						createdAt: expectTimestamp(),
					},
					{
						applicationFormId: applicationForm.id,
						baseFieldShortCode: 'organizationName',
						baseField: {
							label: 'Organization Name',
							description: 'The organizational name of the applicant',
							shortCode: 'organizationName',
							dataType: BaseFieldDataType.STRING,
							createdAt: expectTimestamp(),
						},
						position: 2,
						label: 'Name of Organization',
						instructions: 'Please enter the name of the organization.',
						createdAt: expectTimestamp(),
					},
				],
				createdAt: expectTimestamp(),
			});
		});
		it('returns an application form with its fields when the user has read access to the relevant funder, and the instructions are null', async () => {
			const visibleFunder = await createTestFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: visibleFunder.shortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const opportunity = await createTestOpportunity(db, null, {
				funderShortCode: visibleFunder.shortCode,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			await createTestBaseFields();
			await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: 'organizationName',
				position: 2,
				label: 'Name of Organization',
				instructions: null,
			});
			await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: 'yearsOfWork',
				position: 1,
				label: 'Duration of work in years',
				instructions: null,
			});
			const result = await request(app)
				.get(`/applicationForms/${applicationForm.id}`)
				.set(authHeader)
				.expect(200);

			expect(result.body).toMatchObject({
				id: applicationForm.id,
				opportunityId: opportunity.id,
				version: 1,
				fields: [
					{
						applicationFormId: applicationForm.id,
						baseFieldShortCode: 'yearsOfWork',
						baseField: {
							label: 'Years of work',
							description:
								'The number of years the project will take to complete',
							shortCode: 'yearsOfWork',
							dataType: BaseFieldDataType.STRING,
							createdAt: expectTimestamp(),
						},
						position: 1,
						label: 'Duration of work in years',
						instructions: null,
						createdAt: expectTimestamp(),
					},
					{
						applicationFormId: applicationForm.id,
						baseFieldShortCode: 'organizationName',
						baseField: {
							label: 'Organization Name',
							description: 'The organizational name of the applicant',
							shortCode: 'organizationName',
							dataType: BaseFieldDataType.STRING,
							createdAt: expectTimestamp(),
						},
						position: 2,
						label: 'Name of Organization',
						instructions: null,
						createdAt: expectTimestamp(),
					},
				],
				createdAt: expectTimestamp(),
			});
		});

		it('does not return formFields associated with `FORBIDDEN` BaseFields', async () => {
			const opportunity = await createTestOpportunity(db, null);
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			const forbiddenBaseField = await createOrUpdateBaseField(db, null, {
				label: 'Forbidden Field',
				description: 'This field should not be used in application forms',
				shortCode: 'forbiddenField',
				dataType: BaseFieldDataType.STRING,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: forbiddenBaseField.shortCode,
				position: 1,
				label: 'Anni Worki',
				instructions: 'Please enter the number of years of work.',
			});
			await createOrUpdateBaseField(db, null, {
				...forbiddenBaseField,
				sensitivityClassification: BaseFieldSensitivityClassification.FORBIDDEN,
			});
			const result = await request(app)
				.get(`/applicationForms/${applicationForm.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200);

			expect(result.body).toMatchObject({
				id: applicationForm.id,
				opportunityId: opportunity.id,
				version: 1,
				fields: [],
				createdAt: expectTimestamp(),
			});
		});

		it('should return 404 when the user does not have view opportunity permission', async () => {
			const testFunder = await createTestFunder(db, null);
			const opportunity = await createTestOpportunity(db, null, {
				funderShortCode: testFunder.shortCode,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			await request(app)
				.get(`/applicationForms/${applicationForm.id}`)
				.set(authHeader)
				.expect(404);
		});

		it('should return 404 when the applicationForm does not exist', async () => {
			const result = await request(app)
				.get('/applicationForms/6')
				.set(authHeader)
				.expect(404);
			expect(result.body).toMatchObject({
				name: 'NotFoundError',
				details: expectArray(),
			});
		});
	});

	describe('GET /:applicationFormId/proposalDataCsv', () => {
		it('requires authentication', async () => {
			await request(app).get('/applicationForms/1/proposalDataCsv').expect(401);
		});

		it('returns a CSV with labels matching the application form fields', async () => {
			const visibleFunder = await createTestFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: visibleFunder.shortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const opportunity = await createTestOpportunity(db, null, {
				funderShortCode: visibleFunder.shortCode,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			await createTestBaseFields();
			await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: 'organizationName',
				position: 1,
				label: 'Organization Name',
				instructions: 'Please enter the name of the organization.',
			});
			await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: 'yearsOfWork',
				position: 2,
				label: 'Years of Work',
				instructions: 'Please enter the number of years of work.',
			});

			const result = await request(app)
				.get(`/applicationForms/${applicationForm.id}/proposalDataCsv`)
				.set(authHeader)
				.expect(200);

			expect(result.headers['content-type']).toMatch(/text\/csv/v);
			expect(result.headers['content-disposition']).toBe(
				`attachment; filename="application-form-${applicationForm.id}-proposal-data.csv"`,
			);
			expect(result.text).toBe('Organization Name,Years of Work\n');
		});

		it('returns fields in position order', async () => {
			const visibleFunder = await createTestFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: visibleFunder.shortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const opportunity = await createTestOpportunity(db, null, {
				funderShortCode: visibleFunder.shortCode,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			await createTestBaseFields();

			await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: 'yearsOfWork',
				position: 2,
				label: 'Years of Work',
				instructions: null,
			});
			await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: 'organizationName',
				position: 1,
				label: 'Organization Name',
				instructions: null,
			});

			const result = await request(app)
				.get(`/applicationForms/${applicationForm.id}/proposalDataCsv`)
				.set(authHeader)
				.expect(200);

			expect(result.text).toBe('Organization Name,Years of Work\n');
		});

		it('returns an empty row for a form with no fields', async () => {
			const visibleFunder = await createTestFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: visibleFunder.shortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const opportunity = await createTestOpportunity(db, null, {
				funderShortCode: visibleFunder.shortCode,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});

			const result = await request(app)
				.get(`/applicationForms/${applicationForm.id}/proposalDataCsv`)
				.set(authHeader)
				.expect(200);

			expect(result.text).toBe('\n');
		});

		it('returns 404 when the application form does not exist', async () => {
			const result = await request(app)
				.get('/applicationForms/9999/proposalDataCsv')
				.set(authHeader)
				.expect(404);

			expect(result.body).toMatchObject({
				name: 'NotFoundError',
			});
		});

		it('returns 404 when the user does not have access to the funder', async () => {
			const opportunity = await createTestOpportunity(db, null);
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});

			await request(app)
				.get(`/applicationForms/${applicationForm.id}/proposalDataCsv`)
				.set(authHeader)
				.expect(404);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/applicationForms').expect(401);
		});

		it('creates exactly one application form as a user with proper permissions', async () => {
			const testFunder = await createTestFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: testFunder.shortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.EDIT],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: testFunder.shortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const opportunity = await createTestOpportunity(db, null, {
				funderShortCode: testFunder.shortCode,
			});
			const before = await loadTableMetrics('application_forms');
			const result = await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeader)
				.send({
					opportunityId: opportunity.id,
					name: null,
					fields: [],
				})
				.expect(201);
			const after = await loadTableMetrics('application_forms');
			expect(before.count).toEqual(1);
			expect(result.body).toMatchObject({
				opportunityId: opportunity.id,
				name: null,
				version: 1,
				fields: [],
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(2);
		});

		it('creates exactly one application form as an administrator', async () => {
			const opportunity = await createTestOpportunity(db, null);
			const before = await loadTableMetrics('application_forms');
			const result = await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					opportunityId: opportunity.id,
					name: null,
					fields: [],
				})
				.expect(201);
			const after = await loadTableMetrics('application_forms');
			expect(result.body).toMatchObject({
				opportunityId: opportunity.id,
				name: null,
				version: 1,
				fields: [],
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('creates an application form with a name', async () => {
			const opportunity = await createTestOpportunity(db, null);
			const result = await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					opportunityId: opportunity.id,
					name: '2025 Grant Application',
					fields: [],
				})
				.expect(201);
			expect(result.body).toMatchObject({
				opportunityId: opportunity.id,
				name: '2025 Grant Application',
				version: 1,
				fields: [],
				createdAt: expectTimestamp(),
			});
		});

		it('creates an application form with null name', async () => {
			const opportunity = await createTestOpportunity(db, null);
			const result = await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					opportunityId: opportunity.id,
					name: null,
					fields: [],
				})
				.expect(201);
			expect(result.body).toMatchObject({
				opportunityId: opportunity.id,
				name: null,
				version: 1,
				fields: [],
				createdAt: expectTimestamp(),
			});
		});

		it('returns 400 bad request when no name is provided', async () => {
			await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeader)
				.send({
					opportunityId: 1,
					fields: [],
				})
				.expect(400);
		});

		it(`returns 401 unauthorized if the user does not have edit permission on the associated opportunity's funder`, async () => {
			const testFunder = await createTestFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: testFunder.shortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: testFunder.shortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.MANAGE],
			});
			const opportunity = await createTestOpportunity(db, null, {
				funderShortCode: testFunder.shortCode,
			});
			const before = await loadTableMetrics('application_forms');
			await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeader)
				.send({
					opportunityId: opportunity.id,
					name: null,
					fields: [],
				})
				.expect(401);
			const after = await loadTableMetrics('application_forms');
			expect(before.count).toEqual(1);
			expect(after.count).toEqual(1);
		});

		it('creates exactly the number of provided fields', async () => {
			const opportunity = await createTestOpportunity(db, null);
			await createTestBaseFields();
			const before = await loadTableMetrics('application_form_fields');
			const result = await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					opportunityId: opportunity.id,
					name: null,
					fields: [
						{
							baseFieldShortCode: 'organizationName',
							position: 1,
							label: 'Organization Name',
							instructions: 'Please enter the name of the organization.',
						},
					],
				})
				.expect(201);
			const after = await loadTableMetrics('application_form_fields');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				opportunityId: opportunity.id,
				name: null,
				version: 1,
				fields: [
					{
						baseFieldShortCode: 'organizationName',
						createdAt: expectTimestamp(),
						label: 'Organization Name',
						instructions: 'Please enter the name of the organization.',
						position: 1,
					},
				],
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(1);
		});

		it('increments version when creating a second form for an opportunity', async () => {
			const opportunity = await createTestOpportunity(db, null);
			await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			const result = await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					opportunityId: opportunity.id,
					name: null,
					fields: [],
				})
				.expect(201);
			expect(result.body).toMatchObject({
				opportunityId: opportunity.id,
				version: 3,
				createdAt: expectTimestamp(),
			});
		});

		it('returns 400 when attempting to create a form field using a forbidden base field', async () => {
			const opportunity = await createTestOpportunity(db, null);
			const forbiddenBaseField = await createOrUpdateBaseField(db, null, {
				label: 'Forbidden Field',
				description: 'This field should not be used in application forms',
				shortCode: 'forbiddenField',
				dataType: BaseFieldDataType.STRING,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification: BaseFieldSensitivityClassification.FORBIDDEN,
			});

			const before = await loadTableMetrics('application_forms');
			await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					opportunityId: opportunity.id,
					name: null,
					fields: [
						{
							baseFieldShortCode: forbiddenBaseField.shortCode,
							position: 1,
							label: 'Forbidden Field',
						},
					],
				})
				.expect(400);
			const after = await loadTableMetrics('application_forms');
			expect(after.count).toEqual(before.count);
		});

		it('returns 400 bad request when no opportunity id is provided', async () => {
			await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeader)
				.send({
					fields: [],
				})
				.expect(400);
		});

		it('returns 400 bad request when no fields value is provided', async () => {
			await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeader)
				.send({
					opportunityId: 1,
				})
				.expect(400);
		});

		it('returns 400 bad request when an invalid field is provided', async () => {
			const result = await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeader)
				.send({
					opportunityId: 1,
					name: null,
					fields: [
						{
							foo: 'not a field',
						},
					],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 422 conflict when a non-existent opportunity id is provided', async () => {
			const result = await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					opportunityId: 9999,
					name: null,
					fields: [],
				})
				.expect(422);
			expect(result.body).toMatchObject({
				name: 'UnprocessableEntityError',
				details: expectArray(),
			});
		});

		it('returns 500 UnknownError if a generic Error is thrown when inserting the field', async () => {
			const opportunity = await createTestOpportunity(db, null);
			await createTestBaseFields();
			jest
				.spyOn(db, 'sql')
				.mockReturnValueOnce(
					Promise.resolve({
						command: '',
						row_count: 1,
						rows: [
							{
								id: 1,
								opportunityId: 1,
								version: 1,
								createdAt: new Date(),
							},
						],
					}),
				)
				.mockReturnValueOnce(Promise.reject(new Error('This is unexpected')));
			const result = await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					opportunityId: opportunity.id,
					name: null,
					fields: [
						{
							baseFieldShortCode: 'organizationName',
							position: 1,
							label: 'Organization Name',
						},
					],
				})
				.expect(500);
			expect(result.body).toMatchObject({
				name: 'UnknownError',
				details: expectArray(),
			});
		});
	});
});
