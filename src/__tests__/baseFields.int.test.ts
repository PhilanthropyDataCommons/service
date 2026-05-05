import request from 'supertest';
import { app } from '../app';
import {
	getDatabase,
	createOrUpdateBaseField,
	createOrUpdateBaseFieldLocalization,
	loadBaseFieldBundle,
	loadBaseFieldLocalizationsBundleByBaseFieldShortCode,
	loadTableMetrics,
} from '../database';
import {
	BaseFieldDataType,
	BaseFieldCategory,
	BaseFieldSensitivityClassification,
} from '../types';
import { NO_LIMIT, NO_OFFSET } from '../test/utils';
import { expectArray, expectTimestamp } from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';
import type { TinyPg } from 'tinypg';

const createTestBaseField = async (db: TinyPg) =>
	await createOrUpdateBaseField(db, null, {
		label: 'Summary',
		description: 'A summary of the proposal',
		shortCode: 'summary',
		dataType: BaseFieldDataType.STRING,
		category: BaseFieldCategory.PROJECT,
		valueRelevanceHours: null,
		sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
	});

const createTestBaseFields = async (
	db: TinyPg,
	{
		firstField,
		secondField,
		thirdField,
	}: {
		firstField: BaseFieldSensitivityClassification;
		secondField: BaseFieldSensitivityClassification;
		thirdField: BaseFieldSensitivityClassification;
	},
) => {
	await createOrUpdateBaseField(db, null, {
		label: 'First Field',
		description: 'first',
		shortCode: 'firstField',
		dataType: BaseFieldDataType.STRING,
		category: BaseFieldCategory.PROJECT,
		valueRelevanceHours: null,
		sensitivityClassification: firstField,
	});
	await createOrUpdateBaseField(db, null, {
		label: 'Second Field',
		description: 'second',
		shortCode: 'secondField',
		dataType: BaseFieldDataType.STRING,
		category: BaseFieldCategory.PROJECT,
		valueRelevanceHours: null,
		sensitivityClassification: secondField,
	});
	await createOrUpdateBaseField(db, null, {
		label: 'Third Field',
		description: 'third',
		shortCode: 'thirdField',
		dataType: BaseFieldDataType.STRING,
		category: BaseFieldCategory.PROJECT,
		valueRelevanceHours: null,
		sensitivityClassification: thirdField,
	});
};

const createTestBaseFieldWithLocalization = async (db: TinyPg) => {
	const baseField = await createOrUpdateBaseField(db, null, {
		label: 'Summary',
		description: 'A summary of the proposal',
		shortCode: 'summary',
		dataType: BaseFieldDataType.STRING,
		category: BaseFieldCategory.PROJECT,
		valueRelevanceHours: null,
		sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
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

		it('returns an empty bundle when no data is present', async () => {
			await request(app).get('/baseFields').expect(200, {
				entries: [],
				total: 0,
			});
		});

		it('returns non-forbidden base fields present in the database by default', async () => {
			const db = getDatabase();
			const baseFieldOne = await createOrUpdateBaseField(db, null, {
				label: 'First Name',
				description: 'The first name of the applicant',
				shortCode: 'firstName',
				dataType: BaseFieldDataType.STRING,
				category: BaseFieldCategory.PROJECT,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const baseFieldTwo = await createOrUpdateBaseField(db, null, {
				label: 'Last Name',
				description: 'The last name of the applicant',
				shortCode: 'lastName',
				dataType: BaseFieldDataType.STRING,
				category: BaseFieldCategory.PROJECT,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			await createOrUpdateBaseField(db, null, {
				label: 'Sensitive Details',
				description: 'Super inappropriate details that should not be entered.',
				shortCode: 'forbidden_field',
				dataType: BaseFieldDataType.STRING,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification: BaseFieldSensitivityClassification.FORBIDDEN,
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
			expect(result.body).toStrictEqual({
				total: 2,
				entries: [
					{
						label: 'Last Name',
						description: 'The last name of the applicant',
						shortCode: 'lastName',
						dataType: BaseFieldDataType.STRING,
						category: BaseFieldCategory.PROJECT,
						valueRelevanceHours: null,
						sensitivityClassification:
							BaseFieldSensitivityClassification.RESTRICTED,
						localizations: {
							fr: {
								label: 'postnom',
								language: 'fr',
								createdAt: expectTimestamp(),
								baseFieldShortCode: 'lastName',
								description: 'le postnom',
							},
						},
						createdAt: expectTimestamp(),
					},
					{
						label: 'First Name',
						description: 'The first name of the applicant',
						shortCode: 'firstName',
						dataType: BaseFieldDataType.STRING,
						category: BaseFieldCategory.PROJECT,
						valueRelevanceHours: null,
						sensitivityClassification:
							BaseFieldSensitivityClassification.RESTRICTED,
						localizations: {
							fr: {
								label: 'prenom',
								language: 'fr',
								createdAt: expectTimestamp(),
								baseFieldShortCode: 'firstName',
								description: 'le prenom',
							},
						},
						createdAt: expectTimestamp(),
					},
				],
			});
		});

		it('returns only matching base fields when sensitivityClassifications is a positive list', async () => {
			const db = getDatabase();
			await createTestBaseFields(db, {
				firstField: BaseFieldSensitivityClassification.PUBLIC,
				secondField: BaseFieldSensitivityClassification.RESTRICTED,
				thirdField: BaseFieldSensitivityClassification.FORBIDDEN,
			});

			const result = await request(app)
				.get('/baseFields?sensitivityClassifications=%5B%22public%22%5D')
				.expect(200);
			expect(result.body).toEqual({
				total: 1,
				entries: [
					{
						label: 'First Field',
						description: 'first',
						shortCode: 'firstField',
						dataType: BaseFieldDataType.STRING,
						category: BaseFieldCategory.PROJECT,
						valueRelevanceHours: null,
						sensitivityClassification:
							BaseFieldSensitivityClassification.PUBLIC,
						localizations: {},
						createdAt: expectTimestamp(),
					},
				],
			});
		});

		it('returns all base fields including forbidden when sensitivityClassifications=all', async () => {
			const db = getDatabase();
			await createTestBaseFields(db, {
				firstField: BaseFieldSensitivityClassification.PUBLIC,
				secondField: BaseFieldSensitivityClassification.RESTRICTED,
				thirdField: BaseFieldSensitivityClassification.FORBIDDEN,
			});

			const result = await request(app)
				.get('/baseFields?sensitivityClassifications=all')
				.expect(200);
			expect(result.body).toEqual({
				total: 3,
				entries: [
					{
						label: 'Third Field',
						description: 'third',
						shortCode: 'thirdField',
						dataType: BaseFieldDataType.STRING,
						category: BaseFieldCategory.PROJECT,
						valueRelevanceHours: null,
						sensitivityClassification:
							BaseFieldSensitivityClassification.FORBIDDEN,
						localizations: {},
						createdAt: expectTimestamp(),
					},
					{
						label: 'Second Field',
						description: 'second',
						shortCode: 'secondField',
						dataType: BaseFieldDataType.STRING,
						category: BaseFieldCategory.PROJECT,
						valueRelevanceHours: null,
						sensitivityClassification:
							BaseFieldSensitivityClassification.RESTRICTED,
						localizations: {},
						createdAt: expectTimestamp(),
					},
					{
						label: 'First Field',
						description: 'first',
						shortCode: 'firstField',
						dataType: BaseFieldDataType.STRING,
						category: BaseFieldCategory.PROJECT,
						valueRelevanceHours: null,
						sensitivityClassification:
							BaseFieldSensitivityClassification.PUBLIC,
						localizations: {},
						createdAt: expectTimestamp(),
					},
				],
			});
		});

		it('returns 400 when sensitivityClassifications is unparseable', async () => {
			const result = await request(app)
				.get('/baseFields?sensitivityClassifications=not-json')
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('paginates with _page and _count', async () => {
			const db = getDatabase();
			await createTestBaseFields(db, {
				firstField: BaseFieldSensitivityClassification.PUBLIC,
				secondField: BaseFieldSensitivityClassification.PUBLIC,
				thirdField: BaseFieldSensitivityClassification.PUBLIC,
			});

			const result = await request(app)
				.get('/baseFields?_page=1&_count=2')
				.expect(200);
			expect(result.body).toEqual({
				total: 3,
				entries: [
					{
						label: 'Third Field',
						description: 'third',
						shortCode: 'thirdField',
						dataType: BaseFieldDataType.STRING,
						category: BaseFieldCategory.PROJECT,
						valueRelevanceHours: null,
						sensitivityClassification:
							BaseFieldSensitivityClassification.PUBLIC,
						localizations: {},
						createdAt: expectTimestamp(),
					},
					{
						label: 'Second Field',
						description: 'second',
						shortCode: 'secondField',
						dataType: BaseFieldDataType.STRING,
						category: BaseFieldCategory.PROJECT,
						valueRelevanceHours: null,
						sensitivityClassification:
							BaseFieldSensitivityClassification.PUBLIC,
						localizations: {},
						createdAt: expectTimestamp(),
					},
				],
			});
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
			const db = getDatabase();
			const before = await loadTableMetrics(db, 'base_fields');
			const result = await request(app)
				.put('/baseFields/shorts')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					category: BaseFieldCategory.PROJECT,
					valueRelevanceHours: null,
					sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
				})
				.expect(200);
			const after = await loadTableMetrics(db, 'base_fields');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				label: '🏷️',
				description: '😍',
				shortCode: 'shorts',
				dataType: BaseFieldDataType.STRING,
				category: BaseFieldCategory.PROJECT,
				valueRelevanceHours: null,
				sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
				localizations: {},
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(1);
		});

		it('supports creation of file-type base fields', async () => {
			const db = getDatabase();
			const before = await loadTableMetrics(db, 'base_fields');
			const result = await request(app)
				.put('/baseFields/shorts')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.FILE,
					category: BaseFieldCategory.PROJECT,
					valueRelevanceHours: null,
					sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
				})
				.expect(200);
			const after = await loadTableMetrics(db, 'base_fields');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				label: '🏷️',
				description: '😍',
				shortCode: 'shorts',
				dataType: BaseFieldDataType.FILE,
				category: BaseFieldCategory.PROJECT,
				valueRelevanceHours: null,
				sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
				localizations: {},
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(1);
		});

		it('supports creation of date-type base fields', async () => {
			const db = getDatabase();
			const before = await loadTableMetrics(db, 'base_fields');
			const result = await request(app)
				.put('/baseFields/shorts')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.DATE,
					category: BaseFieldCategory.PROJECT,
					valueRelevanceHours: null,
					sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
				})
				.expect(200);
			const after = await loadTableMetrics(db, 'base_fields');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				label: '🏷️',
				description: '😍',
				shortCode: 'shorts',
				dataType: BaseFieldDataType.DATE,
				category: BaseFieldCategory.PROJECT,
				valueRelevanceHours: null,
				sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
				localizations: {},
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(1);
		});

		it('supports creation of date_time-type base fields', async () => {
			const db = getDatabase();
			const before = await loadTableMetrics(db, 'base_fields');
			const result = await request(app)
				.put('/baseFields/shorts')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.DATETIME,
					category: BaseFieldCategory.PROJECT,
					valueRelevanceHours: null,
					sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
				})
				.expect(200);
			const after = await loadTableMetrics(db, 'base_fields');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				label: '🏷️',
				description: '😍',
				shortCode: 'shorts',
				dataType: BaseFieldDataType.DATETIME,
				category: BaseFieldCategory.PROJECT,
				valueRelevanceHours: null,
				sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
				localizations: {},
				createdAt: expectTimestamp(),
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
					category: BaseFieldCategory.PROJECT,
					valueRelevanceHours: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
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
					category: BaseFieldCategory.PROJECT,
					valueRelevanceHours: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
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
					category: BaseFieldCategory.PROJECT,
					valueRelevanceHours: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
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
					category: BaseFieldCategory.PROJECT,
					valueRelevanceHours: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
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
					category: BaseFieldCategory.PROJECT,
					valueRelevanceHours: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when no category is sent', async () => {
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
				details: expectArray(),
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
					category: BaseFieldCategory.PROJECT,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when an invalid category is sent', async () => {
			const result = await request(app)
				.put('/baseFields/shorts')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					category: '🤡',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('updates the specified base field', async () => {
			const db = getDatabase();
			// Not using the helper here because observing a change in values is explicitly
			// the point of the test, so having full explicit control of the original value
			// seems important.  Some day when we add better test tooling we can have it all.
			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'Summary',
				description: 'A summary of the proposal',
				shortCode: 'summary',
				dataType: BaseFieldDataType.STRING,
				category: BaseFieldCategory.PROJECT,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const result = await request(app)
				.put(`/baseFields/${baseField.shortCode}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.NUMBER,
					category: BaseFieldCategory.ORGANIZATION,
					valueRelevanceHours: 9001,
					sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
				})
				.expect(200);
			expect(result.body).toMatchObject({
				label: '🏷️',
				description: '😍',
				shortCode: 'summary',
				dataType: BaseFieldDataType.NUMBER,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: 9001,
				sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
				localizations: {},
				createdAt: expectTimestamp(),
			});
			const baseFields = await loadBaseFieldBundle(
				db,
				null,
				{
					negated: false,
					list: [BaseFieldSensitivityClassification.PUBLIC],
				},
				NO_LIMIT,
				NO_OFFSET,
			);
			expect(baseFields).toMatchObject({
				total: 1,
				entries: [
					{
						label: '🏷️',
						description: '😍',
						shortCode: 'summary',
						dataType: BaseFieldDataType.NUMBER,
						category: BaseFieldCategory.ORGANIZATION,
						valueRelevanceHours: 9001,
						sensitivityClassification:
							BaseFieldSensitivityClassification.PUBLIC,
						localizations: {},
						createdAt: expectTimestamp(),
					},
				],
			});
		});

		it('returns 400 bad request when no label is sent', async () => {
			const db = getDatabase();
			await createTestBaseField(db);

			const result = await request(app)
				.put('/baseFields/summary')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					category: BaseFieldCategory.ORGANIZATION,
					valueRelevanceHours: null,
					sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when no description is sent', async () => {
			const db = getDatabase();
			await createTestBaseField(db);
			const result = await request(app)
				.put('/baseFields/summary')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					dataType: BaseFieldDataType.STRING,
					category: BaseFieldCategory.ORGANIZATION,
					valueRelevanceHours: null,
					sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when no dataType is sent', async () => {
			const db = getDatabase();
			await createTestBaseField(db);
			const result = await request(app)
				.put('/baseFields/summary')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					category: BaseFieldCategory.ORGANIZATION,
					valueRelevanceHours: null,
					sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when no category is sent', async () => {
			const db = getDatabase();
			await createTestBaseField(db);
			const result = await request(app)
				.put('/baseFields/summary')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					valueRelevanceHours: null,
					sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when no valueRelevanceHours is sent', async () => {
			const db = getDatabase();
			await createTestBaseField(db);
			const result = await request(app)
				.put('/baseFields/summary')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					category: BaseFieldCategory.ORGANIZATION,
					sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when no sensitivityClassification is sent', async () => {
			const db = getDatabase();
			await createTestBaseField(db);
			const result = await request(app)
				.put('/baseFields/summary')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: '🏷️',
					description: '😍',
					dataType: BaseFieldDataType.STRING,
					category: BaseFieldCategory.ORGANIZATION,
					valueRelevanceHours: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});
	});

	describe('GET /:baseFieldShortCode/localizations', () => {
		it('does not require authentication', async () => {
			const db = getDatabase();
			await createTestBaseFieldWithLocalization(db);
			await request(app).get(`/baseFields/summary/localizations`).expect(200);
		});

		it('returns all base field localizations related to the given baseFieldShortCode', async () => {
			const db = getDatabase();
			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'First Name',
				description: 'The first name of the applicant',
				shortCode: 'firstName',
				dataType: BaseFieldDataType.STRING,
				category: BaseFieldCategory.PROJECT,
				valueRelevanceHours: null,
				sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
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
						createdAt: expectTimestamp(),
					},
					{
						baseFieldShortCode: baseField.shortCode,
						language: 'en',
						label: 'First Name',
						description: 'The First Name of the applicant',
						createdAt: expectTimestamp(),
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
				details: expectArray(),
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
			const db = getDatabase();
			const testBaseField = await createTestBaseField(db);
			const before = await loadTableMetrics(db, 'base_field_localizations');
			await request(app)
				.put(`/baseFields/${testBaseField.shortCode}/localizations/fr`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Résume',
					description: 'Le Résume de proposal',
				})
				.expect(200);
			const after = await loadTableMetrics(db, 'base_field_localizations');
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
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(1);
		});

		it('updates only the specified base field if it does exist', async () => {
			const db = getDatabase();
			const baseField = await createTestBaseField(db);
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
			const before = await loadTableMetrics(db, 'base_field_localizations');
			await request(app)
				.put(`/baseFields/${baseField.shortCode}/localizations/fr`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Le Résume',
					description: 'Le grand Résume de proposal',
				})
				.expect(200);
			const after = await loadTableMetrics(db, 'base_field_localizations');
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
				createdAt: expectTimestamp(),
			});
			expect(baseFieldLocalizations.entries[1]).toMatchObject({
				baseFieldShortCode: baseField.shortCode,
				label: 'Summary',
				description: 'The Summary of a proposal',
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(2);
		});

		it('returns 400 when an invalid shortcode is sent', async () => {
			const db = getDatabase();
			await createTestBaseField(db);
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
				details: expectArray(),
			});
		});

		it('returns 400 bad request when no label is sent', async () => {
			const db = getDatabase();
			await createTestBaseField(db);

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
				details: expectArray(),
			});
		});

		it('returns 400 bad request when no description is sent', async () => {
			const db = getDatabase();
			await createTestBaseField(db);
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
				details: expectArray(),
			});
		});

		it('returns 400 when an invalid IETF language tag is sent', async () => {
			const db = getDatabase();
			await createTestBaseField(db);
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
				details: expectArray(),
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
