import request from 'supertest';
import { app } from '../app';
import {
	createBaseField,
	createOrUpdateBaseFieldLocalization,
	loadBaseFieldLocalizationsBundle,
	loadBaseFields,
	loadTableMetrics,
} from '../database';
import { BaseFieldDataType, BaseFieldScope, PostgresErrorCode } from '../types';
import { expectTimestamp } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';

const createTestBaseField = async () =>
	createBaseField({
		label: 'Summary',
		description: 'A summary of the proposal',
		shortCode: 'summary',
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.PROPOSAL,
	});

const createTestBaseFieldWithLocalization = async () => {
	const baseField = await createBaseField({
		label: 'Summary',
		description: 'A summary of the proposal',
		shortCode: 'summary',
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.PROPOSAL,
	});
	await createOrUpdateBaseFieldLocalization({
		baseFieldId: baseField.id,
		label: 'Le Resume',
		description: 'Le Resume de la Applicant',
		language: 'fr',
	});
};

describe('/baseFields', () => {
	describe('GET /', () => {
		it('does not require authentication', async () => {
			await request(app).get('/baseFields').expect(200);
		});

		it('returns an empty array when no data is present', async () => {
			await request(app).get('/baseFields').expect(200, []);
		});

		it('returns all base fields present in the database', async () => {
			const baseFieldOne = await createBaseField({
				label: 'First Name',
				description: 'The first name of the applicant',
				shortCode: 'firstName',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
			});
			const baseFieldTwo = await createBaseField({
				label: 'Last Name',
				description: 'The last name of the applicant',
				shortCode: 'lastName',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
			});

			await createOrUpdateBaseFieldLocalization({
				baseFieldId: baseFieldOne.id,
				language: 'fr',
				label: 'prenom',
				description: 'le prenom',
			});

			await createOrUpdateBaseFieldLocalization({
				baseFieldId: baseFieldTwo.id,
				language: 'fr',
				label: 'postnom',
				description: 'le postnom',
			});

			const result = await request(app).get('/baseFields').expect(200);
			expect(result.body).toMatchObject([
				{
					id: 1,
					label: 'First Name',
					description: 'The first name of the applicant',
					shortCode: 'firstName',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
					localizations: {
						fr: {
							label: 'prenom',
							language: 'fr',
							createdAt: expectTimestamp,
							baseFieldId: 1,
							description: 'le prenom',
						},
					},
					createdAt: expectTimestamp,
				},
				{
					id: 2,
					label: 'Last Name',
					description: 'The last name of the applicant',
					shortCode: 'lastName',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
					localizations: {
						fr: {
							label: 'postnom',
							language: 'fr',
							createdAt: expectTimestamp,
							baseFieldId: 2,
							description: 'le postnom',
						},
					},
					createdAt: expectTimestamp,
				},
			]);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/baseFields').expect(401);
		});

		it('requires administrator role', async () => {
			await request(app).post('/baseFields').set(authHeader).expect(401);
		});

		it('creates exactly one base field', async () => {
			const before = await loadTableMetrics('base_fields');
			const result = await request(app)
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					shortCode: '🩳',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
				})
				.expect(201);
			const after = await loadTableMetrics('base_fields');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: expect.any(Number) as number,
				label: '🏷️',
				description: '😍',
				shortCode: '🩳',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
				localizations: {},
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});

		it('returns 400 bad request when no label is sent', async () => {
			const result = await request(app)
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					shortCode: '🩳',
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no description is sent', async () => {
			const result = await request(app)
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					shortCode: '🩳',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no shortCode is sent', async () => {
			const result = await request(app)
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no dataType is sent', async () => {
			const result = await request(app)
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					shortCode: '🩳',
					scope: BaseFieldScope.PROPOSAL,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when an invalid dataType is sent', async () => {
			const result = await request(app)
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					shortCode: '🩳',
					dataType: '🤡',
					scope: BaseFieldScope.PROPOSAL,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no scope is sent', async () => {
			const result = await request(app)
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					shortCode: '🩳',
					dataType: BaseFieldDataType.STRING,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when an invalid scope is sent', async () => {
			const result = await request(app)
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					shortCode: '🩳',
					dataType: BaseFieldDataType.STRING,
					scope: '🤡',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 409 conflict when a duplicate short name is submitted', async () => {
			await createBaseField({
				label: 'First Name',
				description: 'The first name of the applicant',
				shortCode: 'firstName',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
			});
			const result = await request(app)
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					shortCode: 'firstName',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
				})
				.expect(409);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
				details: [
					{
						code: PostgresErrorCode.UNIQUE_VIOLATION,
					},
				],
			});
		});
	});

	describe('PUT /:baseFieldId', () => {
		it('requires authentication', async () => {
			await request(app).put('/baseFields/1').expect(401);
		});

		it('requires administrator role', async () => {
			await request(app).put('/baseFields/1').set(authHeader).expect(401);
		});

		it('updates the specified base field', async () => {
			// Not using the helper here because observing a change in values is explicitly
			// the point of the test, so having full explicit control of the original value
			// seems important.  Some day when we add better test tooling we can have it all.
			await createBaseField({
				label: 'Summary',
				description: 'A summary of the proposal',
				shortCode: 'summary',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
			});
			await request(app)
				.put('/baseFields/1')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					shortCode: '🩳',
					dataType: BaseFieldDataType.NUMBER,
					scope: BaseFieldScope.ORGANIZATION,
				})
				.expect(200);
			const baseFields = await loadBaseFields();
			expect(baseFields[0]).toMatchObject({
				id: 1,
				label: '🏷️',
				description: '😍',
				shortCode: '🩳',
				dataType: BaseFieldDataType.NUMBER,
				scope: BaseFieldScope.ORGANIZATION,
				localizations: {},
				createdAt: expectTimestamp,
			});
		});

		it('returns the updated base field', async () => {
			await createTestBaseField();
			const result = await request(app)
				.put('/baseFields/1')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					shortCode: '🩳',
					dataType: BaseFieldDataType.NUMBER,
					scope: BaseFieldScope.ORGANIZATION,
				})
				.expect(200);
			expect(result.body).toMatchObject({
				id: 1,
				label: '🏷️',
				description: '😍',
				shortCode: '🩳',
				dataType: BaseFieldDataType.NUMBER,
				scope: BaseFieldScope.ORGANIZATION,
				localizations: {},
				createdAt: expectTimestamp,
			});
		});

		it('returns 400 bad request when no label is sent', async () => {
			await createTestBaseField();

			const result = await request(app)
				.put('/baseFields/1')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					shortCode: '🩳',
					description: '😍',
					dataType: BaseFieldDataType.STRING,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no description is sent', async () => {
			await createTestBaseField();
			const result = await request(app)
				.put('/baseFields/1')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					shortCode: '🩳',
					dataType: BaseFieldDataType.STRING,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no shortCode is sent', async () => {
			await createTestBaseField();
			const result = await request(app)
				.put('/baseFields/1')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.STRING,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no dataType is sent', async () => {
			await createTestBaseField();
			const result = await request(app)
				.put('/baseFields/1')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					shortCode: '🩳',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 when a non-numeric ID is sent', async () => {
			const result = await request(app)
				.put('/baseFields/notanumber')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					shortCode: 'firstName',
					dataType: BaseFieldDataType.STRING,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 404 when attempting to update a non-existent record', async () => {
			await request(app)
				.put('/baseFields/1')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					shortCode: '🩳',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
				})
				.expect(404);
		});
	});
	describe('GET /:baseFieldId/localizations', () => {
		it('does not require authentication', async () => {
			await createTestBaseFieldWithLocalization();
			await request(app).get('/baseFields/1/localizations').expect(200);
		});

		it('returns all base field localizations related to the given baseFieldId', async () => {
			await createBaseField({
				label: 'First Name',
				description: 'The first name of the applicant',
				shortCode: 'firstName',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
			});

			await createOrUpdateBaseFieldLocalization({
				baseFieldId: 1,
				language: 'fr',
				label: 'prenom',
				description: 'le prenom',
			});

			await createOrUpdateBaseFieldLocalization({
				baseFieldId: 1,
				language: 'en',
				label: 'First Name',
				description: 'The First Name of the applicant',
			});

			const result = await request(app)
				.get('/baseFields/1/localizations')
				.expect(200);
			expect(result.body).toMatchObject({
				total: 2,
				entries: [
					{
						baseFieldId: 1,
						language: 'fr',
						label: 'prenom',
						description: 'le prenom',
						createdAt: expectTimestamp,
					},
					{
						baseFieldId: 1,
						language: 'en',
						label: 'First Name',
						description: 'The First Name of the applicant',
						createdAt: expectTimestamp,
					},
				],
			});
		});
		it('returns 404 when a base field is referenced that does not exist', async () => {
			const result = await request(app)
				.get('/baseFields/1/localizations')
				.expect(404);
			expect(result.body).toMatchObject({
				name: 'NotFoundError',
				details: [
					{
						name: 'NotFoundError',
					},
				],
			});
		});
	});

	describe('PUT /:baseFieldId/localizations/:language', () => {
		it('requires authentication', async () => {
			await request(app).put('/baseFields/1/localizations/fr').expect(401);
		});

		it('requires administrator role', async () => {
			await request(app)
				.put('/baseFields/1/localizations/fr')
				.set(authHeader)
				.expect(401);
		});

		it('creates the specified base field localization if it does not exist', async () => {
			await createTestBaseField();
			const before = await loadTableMetrics('base_field_localizations');
			await request(app)
				.put('/baseFields/1/localizations/fr')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Résume',
					description: 'Le Résume de proposal',
				})
				.expect(200);
			const after = await loadTableMetrics('base_field_localizations');
			const baseFieldLocalizations = await loadBaseFieldLocalizationsBundle({
				baseFieldId: 1,
			});
			expect(before.count).toEqual(0);
			expect(baseFieldLocalizations.entries[0]).toMatchObject({
				baseFieldId: 1,
				label: 'Résume',
				description: 'Le Résume de proposal',
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});

		it('updates only the specified base field if it does exist', async () => {
			await createTestBaseField();
			await createOrUpdateBaseFieldLocalization({
				baseFieldId: 1,
				language: 'fr',
				label: 'Résume',
				description: 'Le Résume de proposal',
			});
			await createOrUpdateBaseFieldLocalization({
				baseFieldId: 1,
				language: 'en',
				label: 'Summary',
				description: 'The Summary of a proposal',
			});
			const before = await loadTableMetrics('base_field_localizations');
			await request(app)
				.put('/baseFields/1/localizations/fr')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Le Résume',
					description: 'Le grand Résume de proposal',
				})
				.expect(200);
			const after = await loadTableMetrics('base_field_localizations');
			const baseFieldLocalizations = await loadBaseFieldLocalizationsBundle({
				baseFieldId: 1,
			});
			expect(before.count).toEqual(2);
			expect(baseFieldLocalizations.entries[0]).toMatchObject({
				baseFieldId: 1,
				label: 'Le Résume',
				description: 'Le grand Résume de proposal',
				createdAt: expectTimestamp,
			});
			expect(baseFieldLocalizations.entries[1]).toMatchObject({
				baseFieldId: 1,
				label: 'Summary',
				description: 'The Summary of a proposal',
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(2);
		});

		it('returns 400 bad request when no label is sent', async () => {
			await createTestBaseField();

			const result = await request(app)
				.put('/baseFields/1/localizations/fr')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					description: 'Le Résume de proposal',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no description is sent', async () => {
			await createTestBaseField();
			const result = await request(app)
				.put('/baseFields/1/localizations/fr')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Résume',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 when a non-numeric ID is sent', async () => {
			const result = await request(app)
				.put('/baseFields/notanumber/localizations/fr')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Résume',
					description: 'Le Résume de proposal',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 when an invalid IETF language tag is sent', async () => {
			await createTestBaseField();
			const result = await request(app)
				.put(
					'/baseFields/1/localizations/theLanguageKlingonWhichIsNotARealLanguage',
				)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Ejyo',
					description: 'HoSghaj je nguv',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 404 when a base field is referenced that does not exist', async () => {
			const result = await request(app)
				.put('/baseFields/1/localizations/fr')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Résume',
					description: 'Le Résume de proposal',
				})
				.expect(404);
			expect(result.body).toMatchObject({
				name: 'NotFoundError',
				details: [
					{
						name: 'NotFoundError',
					},
				],
			});
		});
	});
});
