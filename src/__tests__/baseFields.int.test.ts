import request from 'supertest';
import { app } from '../app';
import {
	createBaseField,
	createBaseFieldLocalization,
	loadBaseFields,
	loadBaseFieldLocalizations,
	loadTableMetrics,
} from '../database';
import { BaseFieldDataType, BaseFieldScope, PostgresErrorCode } from '../types';
import { expectTimestamp } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';

const agent = request.agent(app);

const createTestBaseField = async () => {
	const baseField = await createBaseField({
		shortCode: 'summary',
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.PROPOSAL,
	});
	await createBaseFieldLocalization({
		baseFieldId: baseField.id,
		language: 'en',
		label: 'Summary',
		description: 'A summary of the proposal',
	});
};

describe('/baseFields', () => {
	describe('GET /', () => {
		it('does not require authentication', async () => {
			await agent.get('/baseFields').expect(200);
		});

		it('returns an empty array when no data is present', async () => {
			await agent.get('/baseFields').expect(200, []);
		});

		it('returns all base fields present in the database', async () => {
			const baseFieldOne = await createBaseField({
				shortCode: 'firstName',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
			});
			await createBaseFieldLocalization({
				baseFieldId: baseFieldOne.id,
				language: 'en',
				label: 'First Name',
				description: 'The first name of the applicant',
			});
			const baseFieldTwo = await createBaseField({
				shortCode: 'lastName',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
			});
			await createBaseFieldLocalization({
				baseFieldId: baseFieldTwo.id,
				language: 'en',
				label: 'Last Name',
				description: 'The last name of the applicant',
			});
			const result = await agent.get('/baseFields').expect(200);
			expect(result.body).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: 1,
						shortCode: 'firstName',
						dataType: BaseFieldDataType.STRING,
						localizations: [
							expect.objectContaining({
								baseFieldId: 1,
								language: 'en',
								label: 'First Name',
								description: 'The first name of the applicant',
							}),
						],
						createdAt: expectTimestamp,
					}),
					expect.objectContaining({
						id: 2,
						shortCode: 'lastName',
						dataType: BaseFieldDataType.STRING,
						localizations: [
							expect.objectContaining({
								baseFieldId: 2,
								language: 'en',
								label: 'Last Name',
								description: 'The last name of the applicant',
							}),
						],
						createdAt: expectTimestamp,
					}),
				]),
			);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await agent.post('/baseFields').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.post('/baseFields').set(authHeader).expect(401);
		});

		it('creates exactly one base field', async () => {
			const before = await loadTableMetrics('base_fields');
			const result = await agent
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					shortCode: '🩳',
					localizations: [
						{
							language: 'en',
							label: '🏷️',
							description: '😍',
						},
					],
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
				})
				.expect(201);
			const after = await loadTableMetrics('base_fields');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: expect.any(Number) as number,
				shortCode: '🩳',
				localizations: [
					{
						baseFieldId: expect.any(Number) as number,
						language: 'en',
						label: '🏷️',
						description: '😍',
					},
				],
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});

		it('returns 400 bad request when no localizations are sent', async () => {
			const result = await agent
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
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

		it('returns 400 bad request when the localizations array is empty', async () => {
			const result = await agent
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					shortCode: '🩳',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
					localizations: [],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no shortCode is sent', async () => {
			const result = await agent
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					localizations: [
						{
							language: 'en',
							label: '🏷️',
							description: '😍',
						},
					],
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
			const result = await agent
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					shortCode: '🩳',
					localizations: [
						{
							language: 'en',
							label: '🏷️',
							description: '😍',
						},
					],
					scope: BaseFieldScope.PROPOSAL,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when an invalid dataType is sent', async () => {
			const result = await agent
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					shortCode: '🩳',
					localizations: [
						{
							language: 'en',
							label: '🏷️',
							description: '😍',
						},
					],
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
			const result = await agent
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					shortCode: '🩳',
					localizations: [
						{
							language: 'en',
							label: '🏷️',
							description: '😍',
						},
					],
					dataType: BaseFieldDataType.STRING,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when an invalid scope is sent', async () => {
			const result = await agent
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					shortCode: '🩳',
					localizations: [
						{
							language: 'en',
							label: '🏷️',
							description: '😍',
						},
					],
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
			const baseField = await createBaseField({
				shortCode: 'firstName',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
			});
			await createBaseFieldLocalization({
				baseFieldId: baseField.id,
				language: 'en',
				label: 'First Name',
				description: 'The first name of the applicant',
			});
			const result = await agent
				.post('/baseFields')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					shortCode: 'firstName',
					localizations: [
						{
							language: 'en',
							label: '🏷️',
							description: '😍',
						},
					],
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

	describe('POST /:baseFieldId/localizations', () => {
		it('requires authentication', async () => {
			await agent.post('/baseFields/1/localizations').expect(401);
		});

		it('requires administrator role', async () => {
			await agent
				.post('/baseFields/1/localizations')
				.set(authHeader)
				.expect(401);
		});

		it('creates exactly one base field localization', async () => {
			await createTestBaseField();
			const before = await loadTableMetrics('base_field_localizations');
			const result = await agent
				.post('/baseFields/1/localizations')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					language: 'fr',
					label: 'Résumé',
					description: 'Le Résumé',
				})
				.expect(201);
			const after = await loadTableMetrics('base_field_localizations');
			expect(before.count).toEqual(1);
			expect(result.body).toMatchObject({
				baseFieldId: 1,
				language: 'fr',
				label: 'Résumé',
				description: 'Le Résumé',
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(2);
		});

		it('creates a basefield when description is undefined', async () => {
			await createTestBaseField();
			const result = await agent
				.post('/baseFields/1/localizations')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					language: 'fr',
					label: 'Résumé',
				})
				.expect(201);
			expect(result.body).toMatchObject({
				baseFieldId: 1,
				language: 'fr',
				label: 'Résumé',
				description: null,
				createdAt: expectTimestamp,
			});
		});

		it('returns 400 bad request when no language is sent', async () => {
			await createTestBaseField();
			const result = await agent
				.post('/baseFields/1/localizations')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Résumé',
					description: 'Le Résumé',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no label is sent', async () => {
			await createTestBaseField();
			const result = await agent
				.post('/baseFields/1/localizations')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					language: 'fr',
					description: 'Le Résumé',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 409 conflict when a language already exists in the given base field', async () => {
			await createTestBaseField();
			const result = await agent
				.post('/baseFields/1/localizations')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					language: 'en',
					label: 'Date of Birth',
					description: 'Date of Birth',
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

		it('returns 422 conflict when a base field is referenced that does not exist', async () => {
			const result = await agent
				.post('/baseFields/1/localizations')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					language: 'en',
					label: 'First Name',
				})
				.expect(422);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
				details: [
					{
						code: PostgresErrorCode.FOREIGN_KEY_VIOLATION,
					},
				],
			});
		});
	});

	describe('PUT /:baseFieldId', () => {
		it('requires authentication', async () => {
			await agent.put('/baseFields/1').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.put('/baseFields/1').set(authHeader).expect(401);
		});

		it('updates the specified base field', async () => {
			// Not using the helper here because observing a change in values is explicitly
			// the point of the test, so having full explicit control of the original value
			// seems important.  Some day when we add better test tooling we can have it all.
			const baseField = await createBaseField({
				shortCode: 'summary',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
			});
			await createBaseFieldLocalization({
				baseFieldId: baseField.id,
				language: 'en',
				label: 'Summary',
				description: 'A summary of the proposal',
			});
			await agent
				.put('/baseFields/1')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					shortCode: '🩳',
					dataType: BaseFieldDataType.NUMBER,
					scope: BaseFieldScope.ORGANIZATION,
				})
				.expect(200);
			const baseFields = await loadBaseFields();
			expect(baseFields[0]).toMatchObject({
				id: 1,
				shortCode: '🩳',
				localizations: [
					{
						baseFieldId: 1,
						language: 'en',
						label: 'Summary',
						description: 'A summary of the proposal',
					},
				],
				dataType: BaseFieldDataType.NUMBER,
				scope: BaseFieldScope.ORGANIZATION,
				createdAt: expectTimestamp,
			});
		});

		it('returns the updated base field', async () => {
			await createTestBaseField();
			const result = await agent
				.put('/baseFields/1')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					shortCode: '🩳',
					dataType: BaseFieldDataType.NUMBER,
					scope: BaseFieldScope.ORGANIZATION,
				})
				.expect(200);
			expect(result.body).toMatchObject({
				id: 1,
				shortCode: '🩳',
				dataType: BaseFieldDataType.NUMBER,
				scope: BaseFieldScope.ORGANIZATION,
				createdAt: expectTimestamp,
			});
		});

		it('returns 400 bad request when no shortCode is sent', async () => {
			await createTestBaseField();
			const result = await agent
				.put('/baseFields/1')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
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
			const result = await agent
				.put('/baseFields/1')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					shortCode: '🩳',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 when a non-numeric ID is sent', async () => {
			const result = await agent
				.put('/baseFields/notanumber')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
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
			await agent
				.put('/baseFields/1')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					shortCode: '🩳',
					dataType: BaseFieldDataType.STRING,
					scope: BaseFieldScope.PROPOSAL,
				})
				.expect(404);
		});
	});
	describe('PUT /:baseFieldId/:language', () => {
		it('requires authentication', async () => {
			await agent.put('/baseFields/1/en').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.put('/baseFields/1/en').set(authHeader).expect(401);
		});

		it('updates the specified base field localization', async () => {
			// Not using the helper here because observing a change in values is explicitly
			// the point of the test, so having full explicit control of the original value
			// seems important.  Some day when we add better test tooling we can have it all.
			// That day is not yet.
			const baseField = await createBaseField({
				shortCode: 'summary',
				dataType: BaseFieldDataType.STRING,
				scope: BaseFieldScope.PROPOSAL,
			});
			await createBaseFieldLocalization({
				baseFieldId: baseField.id,
				language: 'en',
				label: 'Summary',
				description: 'Summary Description',
			});
			await agent
				.put('/baseFields/1/en')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Soomary',
					description: 'Soooomary Description',
				})
				.expect(200);
			const baseFieldLocalizations = await loadBaseFieldLocalizations();
			expect(baseFieldLocalizations[0]).toMatchObject({
				baseFieldId: baseField.id,
				language: 'en',
				label: 'Soomary',
				description: 'Soooomary Description',
				createdAt: expectTimestamp,
			});
		});

		it('returns the updated base field localization', async () => {
			await createTestBaseField();
			const result = await agent
				.put('/baseFields/1/en')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Soomary',
					description: 'Soooomary Description',
				})
				.expect(200);
			expect(result.body).toMatchObject({
				baseFieldId: 1,
				language: 'en',
				label: 'Soomary',
				description: 'Soooomary Description',
				createdAt: expectTimestamp,
			});
		});

		it('returns 400 bad request when no label is sent', async () => {
			const result = await agent
				.put('/baseFields/1/en')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					description: 'changed description',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 404 when attempting to update a non-existent record', async () => {
			await agent
				.put('/baseFields/1/en')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Summary',
				})
				.expect(404);
		});
	});
});
