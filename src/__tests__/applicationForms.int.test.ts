import request from 'supertest';
import { app } from '../app';
import {
	createApplicationForm,
	createApplicationFormField,
	createOrUpdateBaseField,
	createOpportunity,
	createOrUpdateFunder,
	createOrUpdateUserFunderPermission,
	db,
	loadSystemFunder,
	loadSystemUser,
	loadTableMetrics,
} from '../database';
import { getLogger } from '../logger';
import {
	BaseFieldDataType,
	BaseFieldCategory,
	BaseFieldSensitivityClassification,
	Permission,
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

		it('returns an empty array when no data is present', async () => {
			const response = await request(app)
				.get('/applicationForms')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toMatchObject({
				entries: [],
				total: 0,
			});
		});

		it('returns all application forms present in the database when the user is an administrator', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: 'Tremendous opportunity 👌',
				funderShortCode: systemFunder.shortCode,
			});
			await createOpportunity(db, null, {
				title: 'Good opportunity',
				funderShortCode: systemFunder.shortCode,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 2,
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
						opportunityId: 1,
						version: 2,
					},
					{
						createdAt: expectTimestamp(),
						id: 3,
						opportunityId: 2,
						version: 1,
					},
				],
				total: 3,
			});
		});

		it('returns only application forms that the user is allowed to view', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.VIEW,
			});
			const otherFunder = await createOrUpdateFunder(db, null, {
				shortCode: 'otherFunder',
				name: 'Other Funder',
				keycloakOrganizationId: null,
			});
			await createOpportunity(db, null, {
				title: 'Tremendous opportunity 👌',
				funderShortCode: systemFunder.shortCode,
			});
			await createOpportunity(db, null, {
				title: 'Good opportunity',
				funderShortCode: otherFunder.shortCode,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 2,
			});
			const response = await request(app)
				.get('/applicationForms')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [
					{
						createdAt: expectTimestamp(),
						id: 1,
						opportunityId: 1,
						fields: [],
						version: 1,
					},
					{
						createdAt: expectTimestamp(),
						id: 2,
						opportunityId: 1,
						fields: [],
						version: 2,
					},
				],
				total: 3,
			});
		});
	});

	describe('GET /:applicationFormId', () => {
		it('requires authentication', async () => {
			await request(app).get('/applicationForms/6').expect(401);
		});

		it('returns an application form with its fields when the user is an administrator', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: 'Holiday opportunity 🎄',
				funderShortCode: systemFunder.shortCode,
			});
			await createOpportunity(db, null, {
				title: 'Another holiday opportunity 🕎',
				funderShortCode: systemFunder.shortCode,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 2,
			});
			await createTestBaseFields();
			await createApplicationFormField(db, null, {
				applicationFormId: 3,
				baseFieldShortCode: 'yearsOfWork',
				position: 1,
				label: 'Anni Worki',
				instructions: 'Please enter the number of years of work.',
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 3,
				baseFieldShortCode: 'organizationName',
				position: 2,
				label: 'Org Nomen',
				instructions: 'Please enter the name of the organization.',
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 2,
				baseFieldShortCode: 'organizationName',
				position: 2,
				label: 'Name of Organization',
				instructions: 'Please enter the name of the organization.',
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 2,
				baseFieldShortCode: 'yearsOfWork',
				position: 1,
				label: 'Duration of work in years',
				instructions: 'Please enter the number of years of work.',
			});
			const result = await request(app)
				.get('/applicationForms/2')
				.set(authHeaderWithAdminRole)
				.expect(200);

			expect(result.body).toMatchObject({
				id: 2,
				opportunityId: 1,
				version: 2,
				fields: [
					{
						id: 4,
						applicationFormId: 2,
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
						id: 3,
						applicationFormId: 2,
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
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.VIEW,
			});
			await createOpportunity(db, null, {
				title: 'Holiday opportunity 🎄',
				funderShortCode: systemFunder.shortCode,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createTestBaseFields();
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: 'organizationName',
				position: 2,
				label: 'Name of Organization',
				instructions: 'Please enter the name of the organization.',
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: 'yearsOfWork',
				position: 1,
				label: 'Duration of work in years',
				instructions: 'Please enter the number of years of work.',
			});
			const result = await request(app)
				.get('/applicationForms/1')
				.set(authHeader)
				.expect(200);

			expect(result.body).toMatchObject({
				id: 1,
				opportunityId: 1,
				version: 1,
				fields: [
					{
						applicationFormId: 1,
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
						applicationFormId: 1,
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
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.VIEW,
			});
			await createOpportunity(db, null, {
				title: 'Holiday opportunity 🎄',
				funderShortCode: systemFunder.shortCode,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createTestBaseFields();
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: 'organizationName',
				position: 2,
				label: 'Name of Organization',
				instructions: null,
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: 'yearsOfWork',
				position: 1,
				label: 'Duration of work in years',
				instructions: null,
			});
			const result = await request(app)
				.get('/applicationForms/1')
				.set(authHeader)
				.expect(200);

			expect(result.body).toMatchObject({
				id: 1,
				opportunityId: 1,
				version: 1,
				fields: [
					{
						applicationFormId: 1,
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
						applicationFormId: 1,
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
			const systemFunder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: 'Holiday opportunity 🎄',
				funderShortCode: systemFunder.shortCode,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
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
				.get('/applicationForms/1')
				.set(authHeaderWithAdminRole)
				.expect(200);

			expect(result.body).toMatchObject({
				id: 1,
				opportunityId: 1,
				version: 1,
				fields: [],
				createdAt: expectTimestamp(),
			});
		});

		it('should return 404 when the user does not have read access to the relevant funder', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.EDIT,
			});
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.MANAGE,
			});
			await createOpportunity(db, null, {
				title: 'Holiday opportunity 🎄',
				funderShortCode: systemFunder.shortCode,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createTestBaseFields();
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: 'organizationName',
				position: 2,
				label: 'Name of Organization',
				instructions: 'Please enter the name of the organization.',
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: 'yearsOfWork',
				position: 1,
				label: 'Duration of work in years',
				instructions: 'Please enter the number of years of work.',
			});
			await request(app).get('/applicationForms/1').set(authHeader).expect(404);
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

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/applicationForms').expect(401);
		});

		it('creates exactly one application form as a user with proper permissions', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.EDIT,
			});
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.VIEW,
			});
			await createOpportunity(db, null, {
				title: 'Tremendous opportunity 👌',
				funderShortCode: systemFunder.shortCode,
			});
			const before = await loadTableMetrics('application_forms');
			const result = await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeader)
				.send({
					opportunityId: '1',
					fields: [],
				})
				.expect(201);
			const after = await loadTableMetrics('application_forms');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: 1,
				opportunityId: 1,
				version: 1,
				fields: [],
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(1);
		});

		it('creates exactly one application form as an administrator', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: 'Tremendous opportunity 👌',
				funderShortCode: systemFunder.shortCode,
			});
			const before = await loadTableMetrics('application_forms');
			const result = await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					opportunityId: '1',
					fields: [],
				})
				.expect(201);
			const after = await loadTableMetrics('application_forms');
			expect(result.body).toMatchObject({
				id: 1,
				opportunityId: 1,
				version: 1,
				fields: [],
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it(`returns 401 unauthorized if the user does not have edit permission on the associated opportunity's funder`, async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.VIEW,
			});
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.MANAGE,
			});
			await createOpportunity(db, null, {
				title: 'Tremendous opportunity 👌',
				funderShortCode: systemFunder.shortCode,
			});
			const before = await loadTableMetrics('application_forms');
			await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeader)
				.send({
					opportunityId: '1',
					fields: [],
				})
				.expect(401);
			const after = await loadTableMetrics('application_forms');
			expect(before.count).toEqual(0);
			expect(after.count).toEqual(0);
		});

		it('creates exactly the number of provided fields', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: 'Tremendous opportunity 👌',
				funderShortCode: systemFunder.shortCode,
			});
			await createTestBaseFields();
			const before = await loadTableMetrics('application_form_fields');
			const result = await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					opportunityId: '1',
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
				id: 1,
				opportunityId: 1,
				version: 1,
				fields: [
					{
						applicationFormId: 1,
						baseFieldShortCode: 'organizationName',
						createdAt: expectTimestamp(),
						id: 1,
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
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: 'Tremendous opportunity 👌',
				funderShortCode: systemFunder.shortCode,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			const result = await request(app)
				.post('/applicationForms')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					opportunityId: '1',
					fields: [],
				})
				.expect(201);
			expect(result.body).toMatchObject({
				id: 3,
				opportunityId: 1,
				version: 3,
				createdAt: expectTimestamp(),
			});
		});

		it('returns 400 when attempting to create a form field using a forbidden base field', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: 'Tremendous opportunity 👌',
				funderShortCode: systemFunder.shortCode,
			});
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
					opportunityId: 1,
					fields: [],
				})
				.expect(422);
			expect(result.body).toMatchObject({
				name: 'UnprocessableEntityError',
				details: expectArray(),
			});
		});

		it('returns 500 UnknownError if a generic Error is thrown when inserting the field', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: 'Tremendous opportunity 👌',
				funderShortCode: systemFunder.shortCode,
			});
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
					opportunityId: '1',
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
