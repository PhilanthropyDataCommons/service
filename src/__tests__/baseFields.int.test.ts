import request from 'supertest';
import { app } from '../app';
import {
	db,
	createBaseField,
	createOrUpdateBaseFieldLocalization,
	loadBaseFieldLocalizationsBundleByBaseFieldId,
	loadTableMetrics,
} from '../database';
import { BaseFieldDataType, BaseFieldScope, PostgresErrorCode } from '../types';
import { expectTimestamp, NO_LIMIT, NO_OFFSET } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';

const createTestBaseField = async () =>
	createBaseField(db, null, {
		label: 'Summary',
		description: 'A summary of the proposal',
		shortCode: 'summary',
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.PROPOSAL,
	});

const createTestBaseFieldWithLocalization = async () => {
	const baseField = await createBaseField(db, null, {
		label: 'Summary',
		description: 'A summary of the proposal',
		shortCode: 'summary',
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.PROPOSAL,
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
			const baseFieldOne = await createBaseField(db, null, {
				label: 'First Name',
				description: 'The first name of the applicant',
				shortCode: 'firstName',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
			});
			const baseFieldTwo = await createBaseField(db, null, {
				label: 'Last Name',
				description: 'The last name of the applicant',
				shortCode: 'lastName',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
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
			expect(result.body).toMatchObject([
				{
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
			await createBaseField(db, null, {
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

	describe('GET /:baseFieldShortCode/localizations', () => {
		it('does not require authentication', async () => {
			await createTestBaseFieldWithLocalization();
			await request(app).get(`/baseFields/summary/localizations`).expect(200);
		});

		it('returns all base field localizations related to the given baseFieldShortCode', async () => {
			const baseField = await createBaseField(db, null, {
				label: 'First Name',
				description: 'The first name of the applicant',
				shortCode: 'firstName',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
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
				await loadBaseFieldLocalizationsBundleByBaseFieldId(
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
				await loadBaseFieldLocalizationsBundleByBaseFieldId(
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
