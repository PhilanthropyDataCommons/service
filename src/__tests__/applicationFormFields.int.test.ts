import request from 'supertest';
import { app } from '../app';
import {
	db,
	createApplicationForm,
	createApplicationFormField,
	createOpportunity,
	createOrUpdateBaseField,
	createOrUpdateFunder,
	createPermissionGrant,
	loadSystemFunder,
	loadSystemUser,
} from '../database';
import { getAuthContext, loadTestUser } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';
import {
	BaseFieldDataType,
	BaseFieldCategory,
	BaseFieldSensitivityClassification,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
} from '../types';

describe('/applicationFormFields', () => {
	describe('PATCH /:applicationFormFieldId', () => {
		it('successfully updates the label only', async () => {
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const systemFunder = await loadSystemFunder(db, null);

			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: systemFunder.shortCode,
			});

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
			});

			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'Organization Name',
				shortCode: 'org_name_test_1',
				description: 'The name of the organization',
				dataType: BaseFieldDataType.STRING,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Original Label',
				instructions: 'Original instructions',
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
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
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const systemFunder = await loadSystemFunder(db, null);

			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: systemFunder.shortCode,
			});

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
			});

			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'Email Address',
				shortCode: 'email_address_test_2',
				description: 'Email contact',
				dataType: BaseFieldDataType.EMAIL,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Contact Email',
				instructions: 'Original instructions',
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
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
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const systemFunder = await loadSystemFunder(db, null);

			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: systemFunder.shortCode,
			});

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
			});

			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'Phone Number',
				shortCode: 'phone_number_test_3',
				description: 'Phone contact',
				dataType: BaseFieldDataType.PHONE_NUMBER,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Original Label',
				instructions: 'Original instructions',
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
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
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const systemFunder = await loadSystemFunder(db, null);

			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: systemFunder.shortCode,
			});

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
			});

			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'Website',
				shortCode: 'website_url_test_4',
				description: 'Organization website',
				dataType: BaseFieldDataType.URL,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Website URL',
				instructions: 'Please provide your website',
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
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
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const systemFunder = await loadSystemFunder(db, null);

			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: systemFunder.shortCode,
			});

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
			});

			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'Organization Type',
				shortCode: 'org_type_test_9',
				description: 'Type of organization',
				dataType: BaseFieldDataType.STRING,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Organization Type',
				instructions: 'Please select your organization type',
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
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

		it('returns 400 for empty request body', async () => {
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const systemFunder = await loadSystemFunder(db, null);

			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: systemFunder.shortCode,
			});

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
			});

			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'Test Field',
				shortCode: 'test_field_5',
				description: 'Test',
				dataType: BaseFieldDataType.STRING,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Test Label',
				instructions: null,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
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
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const systemFunder = await loadSystemFunder(db, null);

			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: systemFunder.shortCode,
			});

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
			});

			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'Test Field',
				shortCode: 'test_field_7',
				description: 'Test',
				dataType: BaseFieldDataType.STRING,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Test Label',
				instructions: null,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
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
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const funder = await createOrUpdateFunder(db, null, {
				name: 'Test Funder',
				shortCode: 'test_funder',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});

			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: funder.shortCode,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
			});

			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'Test Field',
				shortCode: 'test_field_8',
				description: 'Test',
				dataType: BaseFieldDataType.STRING,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});

			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Test Label',
				instructions: null,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
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
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const systemFunder = await loadSystemFunder(db, null);

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
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
