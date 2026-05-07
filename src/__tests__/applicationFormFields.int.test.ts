import request from 'supertest';
import { app } from '../app';
import {
	getDatabase,
	createApplicationForm,
	createApplicationFormField,
	createPermissionGrant,
	loadSystemUser,
} from '../database';
import {
	createTestBaseField,
	createTestFunder,
	createTestOpportunity,
} from '../test/factories';
import { getAuthContext, loadTestUser } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';
import {
	ApplicationFormFieldInputType,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
} from '../types';
describe('/applicationFormFields', () => {
	describe('PATCH /:applicationFormFieldId', () => {
		it('successfully updates the label only', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});

			const baseField = await createTestBaseField(db, null);

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Original Label',
				instructions: 'Original instructions',
				inputType: null,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.EDIT],
			});

			const response = await request(app)
				.patch(`/applicationFormFields/${applicationFormField.id}`)
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'Updated Label',
				})
				.expect(200);

			expect(response.body).toEqual({
				...applicationFormField,
				label: 'Updated Label',
			});
		});

		it('successfully updates the instructions only', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});

			const baseField = await createTestBaseField(db, null);

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Contact Email',
				instructions: 'Original instructions',
				inputType: null,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.EDIT],
			});

			const response = await request(app)
				.patch(`/applicationFormFields/${applicationFormField.id}`)
				.type('application/json')
				.set(authHeader)
				.send({
					instructions: 'Updated instructions for email field',
				})
				.expect(200);

			expect(response.body).toEqual({
				...applicationFormField,
				instructions: 'Updated instructions for email field',
			});
		});

		it('successfully updates both label and instructions', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});

			const baseField = await createTestBaseField(db, null);

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Original Label',
				instructions: 'Original instructions',
				inputType: null,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.EDIT],
			});

			const response = await request(app)
				.patch(`/applicationFormFields/${applicationFormField.id}`)
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'Updated Label',
					instructions: 'Updated instructions',
				})
				.expect(200);

			expect(response.body).toEqual({
				...applicationFormField,
				label: 'Updated Label',
				instructions: 'Updated instructions',
			});
		});

		it('successfully updates instructions to null', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});

			const baseField = await createTestBaseField(db, null);

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Website URL',
				instructions: 'Please provide your website',
				inputType: null,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.EDIT],
			});

			const response = await request(app)
				.patch(`/applicationFormFields/${applicationFormField.id}`)
				.type('application/json')
				.set(authHeader)
				.send({
					instructions: null,
				})
				.expect(200);

			expect(response.body).toEqual({
				...applicationFormField,
				instructions: null,
			});
		});

		it('successfully updates label to null', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});

			const baseField = await createTestBaseField(db, null);

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Organization Type',
				instructions: 'Please select your organization type',
				inputType: null,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.EDIT],
			});

			const response = await request(app)
				.patch(`/applicationFormFields/${applicationFormField.id}`)
				.type('application/json')
				.set(authHeader)
				.send({
					label: null,
				})
				.expect(200);

			expect(response.body).toEqual({
				...applicationFormField,
				label: null,
			});
		});

		it('successfully updates inputType', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});

			const baseField = await createTestBaseField(db, null);

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Input Type Test',
				instructions: 'Test instructions',
				inputType: null,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.EDIT],
			});

			const response = await request(app)
				.patch(`/applicationFormFields/${applicationFormField.id}`)
				.type('application/json')
				.set(authHeader)
				.send({
					inputType: ApplicationFormFieldInputType.DROPDOWN,
				})
				.expect(200);

			expect(response.body).toEqual({
				...applicationFormField,
				inputType: ApplicationFormFieldInputType.DROPDOWN,
			});
		});

		it('returns 400 for empty request body', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});

			const baseField = await createTestBaseField(db, null);

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Test Label',
				instructions: null,
				inputType: null,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.EDIT],
			});

			await request(app)
				.patch(`/applicationFormFields/${applicationFormField.id}`)
				.type('application/json')
				.set(authHeader)
				.send({})
				.expect(400);
		});

		it('returns 400 for attempting to update read-only fields', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});

			const baseField = await createTestBaseField(db, null);

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Test Label',
				instructions: null,
				inputType: null,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.EDIT],
			});

			await request(app)
				.patch(`/applicationFormFields/${applicationFormField.id}`)
				.type('application/json')
				.set(authHeader)
				.send({
					position: 5,
				})
				.expect(400);
		});

		it('returns 401 for missing authentication', async () => {
			await request(app)
				.patch('/applicationFormFields/1')
				.type('application/json')
				.send({
					label: 'New Label',
				})
				.expect(401);
		});

		it('returns 401 for user without funder EDIT permission', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const funder = await createTestFunder(db, testUserAuthContext);

			const opportunity = await createTestOpportunity(db, testUserAuthContext, {
				funderShortCode: funder.shortCode,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});

			const baseField = await createTestBaseField(db, null);

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Test Label',
				instructions: null,
				inputType: null,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});

			await request(app)
				.patch(`/applicationFormFields/${applicationFormField.id}`)
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'New Label',
				})
				.expect(401);
		});

		it('returns 404 for non-existent applicationFormFieldId', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: opportunity.funderShortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.EDIT],
			});

			await request(app)
				.patch('/applicationFormFields/999999')
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'New Label',
				})
				.expect(404);
		});
	});
});
