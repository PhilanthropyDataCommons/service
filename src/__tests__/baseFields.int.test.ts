import request from 'supertest';
import { app } from '../app';
import {
	db,
	createOrUpdateBaseField,
	createOrUpdateBaseFieldLocalization,
	loadBaseFieldLocalizationsBundleByBaseFieldShortCode,
	loadTableMetrics,
	loadBaseFields,
} from '../database';
import { BaseFieldDataType, BaseFieldScope } from '../types';
import { expectTimestamp, NO_LIMIT, NO_OFFSET } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';

const createTestBaseField = async () =>
	createOrUpdateBaseField(db, null, {
		label: 'Summary',
		description: 'A summary of the proposal',
		shortCode: 'summary',
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.PROPOSAL,
		valueRelevanceHours: null,
	});

const createTestBaseFieldWithLocalization = async () => {
	const baseField = await createOrUpdateBaseField(db, null, {
		label: 'Summary',
		description: 'A summary of the proposal',
		shortCode: 'summary',
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.PROPOSAL,
		valueRelevanceHours: null,
	});
	const baseFieldLocalization = await createOrUpdateBaseFieldLocalization(
		db,
		null,
		{
			baseFieldShortCode: baseField.shortCode,
			label: 'Le Resume',
			description: 'Le Resume de la Applicant',
			language: 'fr',
		},
	);
	return { baseField, baseFieldLocalization };
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
			const baseFieldOne = await createOrUpdateBaseField(db, null, {
				label: 'First Name',
				description: 'The first name of the applicant',
				shortCode: 'firstName',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
				valueRelevanceHours: null,
			});
			const baseFieldTwo = await createOrUpdateBaseField(db, null, {
				label: 'Last Name',
				description: 'The last name of the applicant',
				shortCode: 'lastName',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
				valueRelevanceHours: null,
			});

			await createOrUpdateBaseFieldLocalization(db, null, {
				baseFieldShortCode: baseFieldOne.shortCode,
				language: 'fr',
				label: 'prenom',
				description: 'le prenom',
			});

			await createOrUpdateBaseFieldLocalization(db, null, {
				baseFieldShortCode: baseFieldTwo.shortCode,
				language: 'fr',
				label: 'postnom',
				description: 'le postnom',
			});

			const result = await request(app).get('/baseFields').expect(200);
			expect(result.body).toEqual([
				{
					label: 'First Name',
					description: 'The first name of the applicant',
					shortCode: 'firstName',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
					valueRelevanceHours: null,
					localizations: {
						fr: {
							label: 'prenom',
							language: 'fr',
							createdAt: expectTimestamp,
							baseFieldShortCode: 'firstName',
							description: 'le prenom',
						},
					},
					createdAt: expectTimestamp,
				},
				{
					label: 'Last Name',
					description: 'The last name of the applicant',
					shortCode: 'lastName',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
					valueRelevanceHours: null,
					localizations: {
						fr: {
							label: 'postnom',
							language: 'fr',
							createdAt: expectTimestamp,
							baseFieldShortCode: 'lastName',
							description: 'le postnom',
						},
					},
					createdAt: expectTimestamp,
				},
			]);
		});
	});

	describe('PUT /:baseFieldShortCode', () => {
		it('requires authentication', async () => {
			await request(app).put('/baseFields/summary').expect(401);
		});

		it('requires administrator role', async () => {
			await request(app).put('/baseFields/summary').set(authHeader).expect(401);
		});

		it('creates exactly one base field', async () => {
			const before = await loadTableMetrics('base_fields');
			const result = await request(app)
				.put('/baseFields/shorts')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
					valueRelevanceHours: null,
				})
				.expect(200);
			const after = await loadTableMetrics('base_fields');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				label: '🏷️',
				description: '😍',
				shortCode: 'shorts',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
				valueRelevanceHours: null,
				localizations: {},
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});

		it('returns 400 bad request when no label is sent', async () => {
			const result = await request(app)
				.put('/baseFields/shorts')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
					valueRelevanceHours: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no description is sent', async () => {
			const result = await request(app)
				.put('/baseFields/shorts')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
					valueRelevanceHours: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when invalid shortcode is provided', async () => {
			const result = await request(app)
				.put('/baseFields/invalid-shortcode!')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
					valueRelevanceHours: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no dataType is sent', async () => {
			const result = await request(app)
				.put('/baseFields/shorts')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					scope: BaseFieldScope.PROPOSAL,
					valueRelevanceHours: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when an invalid dataType is sent', async () => {
			const result = await request(app)
				.put('/baseFields/shorts')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: '🤡',
					scope: BaseFieldScope.PROPOSAL,
					valueRelevanceHours: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no scope is sent', async () => {
			const result = await request(app)
				.put('/baseFields/shorts')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					valueRelevanceHours: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no valueRelevanceHours is sent', async () => {
			const result = await request(app)
				.put('/baseFields/shorts')
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

		it('returns 400 bad request when an invalid scope is sent', async () => {
			const result = await request(app)
				.put('/baseFields/shorts')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					scope: '🤡',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('updates the specified base field', async () => {
			// Not using the helper here because observing a change in values is explicitly
			// the point of the test, so having full explicit control of the original value
			// seems important.  Some day when we add better test tooling we can have it all.
			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'Summary',
				description: 'A summary of the proposal',
				shortCode: 'summary',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
				valueRelevanceHours: null,
			});
			await request(app)
				.put(`/baseFields/${baseField.shortCode}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.NUMBER,
					scope: BaseFieldScope.ORGANIZATION,
					valueRelevanceHours: 9001,
				})
				.expect(200);
			const baseFields = await loadBaseFields();
			expect(baseFields[0]).toEqual({
				label: '🏷️',
				description: '😍',
				shortCode: 'summary',
				dataType: BaseFieldDataType.NUMBER,
				scope: BaseFieldScope.ORGANIZATION,
				valueRelevanceHours: 9001,
				localizations: {},
				createdAt: expectTimestamp,
			});
		});

		it('returns the updated base field', async () => {
			await createTestBaseField();
			const result = await request(app)
				.put('/baseFields/summary')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.NUMBER,
					valueRelevanceHours: null,
					scope: BaseFieldScope.ORGANIZATION,
				})
				.expect(200);
			expect(result.body).toMatchObject({
				label: '🏷️',
				description: '😍',
				shortCode: 'summary',
				dataType: BaseFieldDataType.NUMBER,
				scope: BaseFieldScope.ORGANIZATION,
				valueRelevanceHours: null,
				localizations: {},
				createdAt: expectTimestamp,
			});
		});

		it('returns 400 bad request when no label is sent', async () => {
			await createTestBaseField();

			const result = await request(app)
				.put('/baseFields/summary')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.ORGANIZATION,
					valueRelevanceHours: null,
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
				.put('/baseFields/summary')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.ORGANIZATION,
					valueRelevanceHours: null,
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
				.put('/baseFields/summary')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					scope: BaseFieldScope.ORGANIZATION,
					valueRelevanceHours: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no scope is sent', async () => {
			await createTestBaseField();
			const result = await request(app)
				.put('/baseFields/summary')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					valueRelevanceHours: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no valueRelevanceHours is sent', async () => {
			await createTestBaseField();
			const result = await request(app)
				.put('/baseFields/summary')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.ORGANIZATION,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});
	});

	describe('GET /:baseFieldShortCode/localizations', () => {
		it('does not require authentication', async () => {
			await createTestBaseFieldWithLocalization();
			await request(app).get(`/baseFields/summary/localizations`).expect(200);
		});

		it('returns all base field localizations related to the given baseFieldShortCode', async () => {
			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'First Name',
				description: 'The first name of the applicant',
				shortCode: 'firstName',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
				valueRelevanceHours: null,
			});

			await createOrUpdateBaseFieldLocalization(db, null, {
				baseFieldShortCode: baseField.shortCode,
				language: 'fr',
				label: 'prenom',
				description: 'le prenom',
			});

			await createOrUpdateBaseFieldLocalization(db, null, {
				baseFieldShortCode: baseField.shortCode,
				language: 'en',
				label: 'First Name',
				description: 'The First Name of the applicant',
			});

			const result = await request(app)
				.get(`/baseFields/${baseField.shortCode}/localizations`)
				.expect(200);
			expect(result.body).toMatchObject({
				total: 2,
				entries: [
					{
						baseFieldShortCode: baseField.shortCode,
						language: 'fr',
						label: 'prenom',
						description: 'le prenom',
						createdAt: expectTimestamp,
					},
					{
						baseFieldShortCode: baseField.shortCode,
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
				.get('/baseFields/fakeShortCode/localizations')
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

		it('returns 400 when an invalid shortcode is sent', async () => {
			const result = await request(app)
				.get('/baseFields/invalidShortcode!!!/localizations')
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});
	});

	describe('PUT /:baseFieldShortCode/localizations/:language', () => {
		it('requires authentication', async () => {
			await request(app)
				.put('/baseFields/summary/localizations/fr')
				.expect(401);
		});

		it('requires administrator role', async () => {
			await request(app)
				.put('/baseFields/summary/localizations/fr')
				.set(authHeader)
				.expect(401);
		});

		it('creates the specified base field localization if it does not exist', async () => {
			const testBaseField = await createTestBaseField();
			const before = await loadTableMetrics('base_field_localizations');
			await request(app)
				.put(`/baseFields/${testBaseField.shortCode}/localizations/fr`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Résume',
					description: 'Le Résume de proposal',
				})
				.expect(200);
			const after = await loadTableMetrics('base_field_localizations');
			const baseFieldLocalizations =
				await loadBaseFieldLocalizationsBundleByBaseFieldShortCode(
					db,
					null,
					testBaseField.shortCode,
					NO_LIMIT,
					NO_OFFSET,
				);
			expect(before.count).toEqual(0);
			expect(baseFieldLocalizations.entries[0]).toMatchObject({
				baseFieldShortCode: testBaseField.shortCode,
				label: 'Résume',
				description: 'Le Résume de proposal',
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});

		it('updates only the specified base field if it does exist', async () => {
			const baseField = await createTestBaseField();
			await createOrUpdateBaseFieldLocalization(db, null, {
				baseFieldShortCode: baseField.shortCode,
				language: 'fr',
				label: 'Résume',
				description: 'Le Résume de proposal',
			});
			await createOrUpdateBaseFieldLocalization(db, null, {
				baseFieldShortCode: baseField.shortCode,
				language: 'en',
				label: 'Summary',
				description: 'The Summary of a proposal',
			});
			const before = await loadTableMetrics('base_field_localizations');
			await request(app)
				.put(`/baseFields/${baseField.shortCode}/localizations/fr`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Le Résume',
					description: 'Le grand Résume de proposal',
				})
				.expect(200);
			const after = await loadTableMetrics('base_field_localizations');
			const baseFieldLocalizations =
				await loadBaseFieldLocalizationsBundleByBaseFieldShortCode(
					db,
					null,
					baseField.shortCode,
					NO_LIMIT,
					NO_OFFSET,
				);
			expect(before.count).toEqual(2);
			expect(baseFieldLocalizations.entries[0]).toMatchObject({
				baseFieldShortCode: baseField.shortCode,
				label: 'Le Résume',
				description: 'Le grand Résume de proposal',
				createdAt: expectTimestamp,
			});
			expect(baseFieldLocalizations.entries[1]).toMatchObject({
				baseFieldShortCode: baseField.shortCode,
				label: 'Summary',
				description: 'The Summary of a proposal',
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(2);
		});

		it('returns 400 when an invalid shortcode is sent', async () => {
			await createTestBaseField();
			const result = await request(app)
				.put('/baseFields/invalid-shortcode!!!!!/localizations/en')
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

		it('returns 400 bad request when no label is sent', async () => {
			await createTestBaseField();

			const result = await request(app)
				.put('/baseFields/summary/localizations/fr')
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
				.put('/baseFields/summary/localizations/fr')
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

		it('returns 400 when an invalid IETF language tag is sent', async () => {
			await createTestBaseField();
			const result = await request(app)
				.put(
					'/baseFields/summary/localizations/theLanguageKlingonWhichIsNotARealLanguage',
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
				.put('/baseFields/shortCode/localizations/fr')
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
