import request from 'supertest';
import { app } from '../app';
import { db, loadTableMetrics } from '../database';
import { getLogger } from '../logger';
import { BaseFieldDataType, PostgresErrorCode } from '../types';
import { expectTimestamp } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';

const logger = getLogger(__filename);
const agent = request.agent(app);

const createTestBaseFields = async () => {
	await db.sql('baseFields.insertOne', {
		label: 'Organization Name',
		description: 'The organizational name of the applicant',
		shortCode: 'organizationName',
		dataType: BaseFieldDataType.STRING,
	});
	await db.sql('baseFields.insertOne', {
		label: 'Years of work',
		description: 'The number of years the project will take to complete',
		shortCode: 'yearsOfWork',
		dataType: BaseFieldDataType.STRING,
	});
};

describe('/applicationForms', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/applicationForms').expect(401);
		});

		it('returns an empty array when no data is present', async () => {
			const response = await agent
				.get('/applicationForms')
				.set(authHeader)
				.expect(200);
			expect(response.body).toMatchObject({
				entries: [],
				total: 0,
			});
		});

		it('returns all application forms present in the database', async () => {
			await db.query(`
        INSERT INTO opportunities (title)
        VALUES
          ( 'Tremendous opportunity 👌' ),
          ( 'Good opportunity' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' ),
          ( 1, 2, '2022-08-20 12:00:00+0000' ),
          ( 2, 1, '2022-09-20 12:00:00+0000' )
      `);
			const response = await agent
				.get('/applicationForms')
				.set(authHeader)
				.expect(200);
			expect(response.body).toMatchObject({
				entries: [
					{
						createdAt: expectTimestamp,
						id: 1,
						opportunityId: 1,
						version: 1,
					},
					{
						createdAt: expectTimestamp,
						id: 2,
						opportunityId: 1,
						version: 2,
					},
					{
						createdAt: expectTimestamp,
						id: 3,
						opportunityId: 2,
						version: 1,
					},
				],
				total: 3,
			});
		});

		it('returns an application form with its fields', async () => {
			await db.query(`
        INSERT INTO opportunities (title)
        VALUES
          ( 'Holiday opportunity 🎄' ),
          ( 'Another holiday opportunity 🕎' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2510-02-01 00:00:01+0000' ),
          ( 1, 2, '2510-02-01 00:00:02+0000' ),
          ( 2, 1, '2510-02-01 00:00:03+0000' )
      `);
			await createTestBaseFields();
			await db.query(`
        INSERT INTO application_form_fields (
          application_form_id,
          base_field_id,
          position,
          label,
          created_at
        )
        VALUES
          ( 3, 2, 1, 'Anni Worki', '2510-02-01 00:00:06+0000' ),
          ( 3, 1, 2, 'Org Nomen', '2510-02-01 00:00:07+0000' ),
          ( 2, 1, 2, 'Name of Organization', '2510-02-01 00:00:08+0000' ),
          ( 2, 2, 1, 'Duration of work in years','2510-02-01 00:00:09+0000' )
      `);
			const result = await agent
				.get('/applicationForms/2')
				.set(authHeader)
				.expect(200);

			expect(result.body).toMatchObject({
				id: 2,
				opportunityId: 1,
				version: 2,
				fields: [
					{
						id: 4,
						applicationFormId: 2,
						baseFieldId: 2,
						baseField: {
							id: 2,
							label: 'Years of work',
							description:
								'The number of years the project will take to complete',
							shortCode: 'yearsOfWork',
							dataType: BaseFieldDataType.STRING,
							createdAt: expectTimestamp,
						},
						position: 1,
						label: 'Duration of work in years',
						createdAt: expectTimestamp,
					},
					{
						id: 3,
						applicationFormId: 2,
						baseFieldId: 1,
						baseField: {
							id: 1,
							label: 'Organization Name',
							description: 'The organizational name of the applicant',
							shortCode: 'organizationName',
							dataType: BaseFieldDataType.STRING,
							createdAt: expectTimestamp,
						},
						position: 2,
						label: 'Name of Organization',
						createdAt: expectTimestamp,
					},
				],
				createdAt: expectTimestamp,
			});
		});

		it('should return 404 when the applicationForm is not found (shallow)', async () => {
			const result = await agent
				.get('/applicationForms/6')
				.set(authHeader)
				.expect(404);
			expect(result.body).toMatchObject({
				name: 'NotFoundError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('should return 404 when the applicationForm is not found (with fields)', async () => {
			const result = await agent
				.get('/applicationForms/7')
				.query({ includeFields: 'true' })
				.set(authHeader)
				.expect(404);
			expect(result.body).toMatchObject({
				name: 'NotFoundError',
				details: expect.any(Array) as unknown[],
			});
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await agent.post('/applicationForms').expect(401);
		});

		it('creates exactly one application form', async () => {
			await db.query(`
        INSERT INTO opportunities ( title )
        VALUES ( 'Tremendous opportunity 👌' );
      `);
			const before = await loadTableMetrics('application_forms');
			const result = await agent
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
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});

		it('creates exactly the number of provided fields', async () => {
			await db.query(`
        INSERT INTO opportunities ( title )
        VALUES ( 'Tremendous opportunity 👌' );
      `);
			await createTestBaseFields();
			const before = await loadTableMetrics('application_form_fields');
			const result = await agent
				.post('/applicationForms')
				.type('application/json')
				.set(authHeader)
				.send({
					opportunityId: '1',
					fields: [
						{
							baseFieldId: '1',
							position: 1,
							label: 'Your First Name',
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
						baseFieldId: 1,
						createdAt: expectTimestamp,
						id: 1,
						label: 'Your First Name',
						position: 1,
					},
				],
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});

		it('increments version when creating a second form for an opportunity', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( 'Tremendous opportunity 👌', '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' ),
          ( 1, 2, '2022-08-20 12:00:00+0000' )
      `);
			const result = await agent
				.post('/applicationForms')
				.type('application/json')
				.set(authHeader)
				.send({
					opportunityId: '1',
					fields: [],
				})
				.expect(201);
			expect(result.body).toMatchObject({
				id: 3,
				opportunityId: 1,
				version: 3,
				createdAt: expectTimestamp,
			});
		});

		it('returns 400 bad request when no opportunity id is provided', async () => {
			await agent
				.post('/applicationForms')
				.type('application/json')
				.set(authHeader)
				.send({
					fields: [],
				})
				.expect(400);
		});

		it('returns 400 bad request when no fields value is provided', async () => {
			await agent
				.post('/applicationForms')
				.type('application/json')
				.set(authHeader)
				.send({
					opportunityId: 1,
				})
				.expect(400);
		});

		it('returns 400 bad request when an invalid field is provided', async () => {
			const result = await agent
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
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 409 conflict when a non-existent opportunity id is provided', async () => {
			const result = await agent
				.post('/applicationForms')
				.type('application/json')
				.set(authHeader)
				.send({
					opportunityId: 1,
					fields: [],
				})
				.expect(409);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
				details: [
					{
						code: PostgresErrorCode.FOREIGN_KEY_VIOLATION,
					},
				],
			});
		});

		it('returns 500 UnknownError if a generic Error is thrown when inserting the field', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( 'Tremendous opportunity 👌', '2525-01-01T00:00:05Z' );
      `);
			await createTestBaseFields();
			jest
				.spyOn(db, 'sql')
				.mockImplementationOnce(async () => ({
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
				}))
				.mockImplementationOnce(async () => {
					throw new Error('This is unexpected');
				});
			const result = await agent
				.post('/applicationForms')
				.type('application/json')
				.set(authHeader)
				.send({
					opportunityId: '1',
					fields: [
						{
							baseFieldId: '1',
							position: 1,
							label: 'Your First Name',
						},
					],
				})
				.expect(500);
			expect(result.body).toMatchObject({
				name: 'UnknownError',
				details: expect.any(Array) as unknown[],
			});
		});
	});
});
