import request from 'supertest';
import { TinyPgError } from 'tinypg';
import { app } from '../app';
import { db, loadTableMetrics } from '../database';
import { getLogger } from '../logger';
import { expectTimestamp } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';
import { PostgresErrorCode } from '../types/PostgresErrorCode';
import type { Result } from 'tinypg';

const logger = getLogger(__filename);
const agent = request.agent(app);

const createTestBaseFields = async () => {
	await db.sql('baseFields.insertOne', {
		label: 'First Name',
		description: 'The first name of the applicant',
		shortCode: 'firstName',
		dataType: 'string',
	});
	await db.sql('baseFields.insertOne', {
		label: 'Last Name',
		description: 'The last name of the applicant',
		shortCode: 'lastName',
		dataType: 'string',
	});
};

describe('/proposalVersions', () => {
	describe('POST /', () => {
		it('creates exactly one proposal version', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' );
      `);
			const before = await loadTableMetrics('proposal_versions');
			logger.debug('before: %o', before);
			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					fieldValues: [],
				})
				.expect(201);
			const after = await loadTableMetrics('proposal_versions');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: 1,
				proposalId: 1,
				fieldValues: [],
			});
			expect(after.count).toEqual(1);
		});

		it('creates exactly the number of provided field values', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' );
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
          ( 1, 1, 1, 'First Name', '2022-07-20 12:00:00+0000' ),
          ( 1, 2, 2, 'Last Name', '2022-07-20 12:00:00+0000' );
      `);
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					fieldValues: [
						{
							applicationFormFieldId: 1,
							position: 1,
							value: 'Gronald',
						},
						{
							applicationFormFieldId: 2,
							position: 1,
							value: 'Plorp',
						},
					],
				})
				.expect(201);
			const after = await loadTableMetrics('proposal_field_values');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: 1,
				proposalId: 1,
				fieldValues: [
					{
						id: 1,
						applicationFormFieldId: 1,
						position: 1,
						value: 'Gronald',
						createdAt: expectTimestamp,
					},
					{
						id: 2,
						applicationFormFieldId: 2,
						position: 1,
						value: 'Plorp',
						createdAt: expectTimestamp,
					},
				],
			});
			expect(after.count).toEqual(2);
		});

		it('returns 400 bad request when no proposal id is provided', async () => {
			await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					applicationFormId: 1,
					fieldValues: [],
				})
				.expect(400);
		});

		it('returns 400 bad request when no application id is provided', async () => {
			await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					fieldValues: [],
				})
				.expect(400);
		});

		it('returns 400 bad request when no field values array is provided', async () => {
			await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 1,
				})
				.expect(400);
		});

		it('returns 409 Conflict when the provided proposal does not exist', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' );
      `);
			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 2,
					applicationFormId: 1,
					fieldValues: [],
				})
				.expect(409);

			expect(result.body).toMatchObject({
				name: 'InputConflictError',
				details: [
					{
						entityType: 'Proposal',
						entityId: 2,
					},
				],
			});
		});

		it('Returns 409 Conflict if the provided application form does not exist', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' );
      `);
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 2,
					fieldValues: [],
				})
				.expect(409);
			const after = await loadTableMetrics('proposal_field_values');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				name: 'InputConflictError',
				details: [
					{
						entityType: 'ApplicationForm',
						entityId: 2,
					},
				],
			});
			expect(after.count).toEqual(0);
		});

		it('Returns 409 Conflict if the provided application form ID is not associated with the proposal opportunity', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' ),
          ( '💧', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' ),
          ( 2, 1, '2022-07-20 12:00:00+0000' );
      `);
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 2,
					fieldValues: [],
				})
				.expect(409);
			const after = await loadTableMetrics('proposal_field_values');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				name: 'InputConflictError',
				details: [
					{
						entityType: 'ApplicationForm',
						entityId: 2,
						contextEntityType: 'Proposal',
						contextEntityId: 1,
					},
				],
			});
			expect(after.count).toEqual(0);
		});

		it('Returns 409 Conflict if a provided application form field ID does not exist', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' );
      `);
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					fieldValues: [
						{
							applicationFormFieldId: 1,
							position: 1,
							value: 'Gronald',
						},
					],
				})
				.expect(409);
			const after = await loadTableMetrics('proposal_field_values');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				name: 'InputConflictError',
				details: [
					{
						entityType: 'ApplicationFormField',
						entityId: 1,
					},
				],
			});
			expect(after.count).toEqual(0);
		});

		it('Returns 409 Conflict if a provided application form field ID is not associated with the supplied application form ID', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' ),
          ( 1, 2, '2022-07-20 12:00:00+0000' );
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
          ( 1, 1, 1, 'First Name', '2022-07-20 12:00:00+0000' ),
          ( 1, 2, 2, 'Last Name', '2022-07-20 12:00:00+0000' );
      `);
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 2,
					fieldValues: [
						{
							applicationFormFieldId: 1,
							position: 1,
							value: 'Gronald',
						},
					],
				})
				.expect(409);
			const after = await loadTableMetrics('proposal_field_values');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				name: 'InputConflictError',
				details: [
					{
						entityType: 'ApplicationForm',
						entityId: 2,
						contextEntityType: 'ApplicationFormField',
						contextEntityId: 1,
					},
				],
			});
			expect(after.count).toEqual(0);
		});

		it('returns 500 UnknownError if a generic Error is thrown when inserting the proposal version', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' );
      `);
			jest.spyOn(db, 'sql').mockImplementationOnce(async () => {
				throw new Error('This is unexpected');
			});
			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					fieldValues: [],
				})
				.expect(500);
			expect(result.body).toMatchObject({
				name: 'UnknownError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 500 if the database returns an unexpected data structure when selecting the the application form for validation', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' );
      `);
			const unmockedDbSqlFunction = db.sql.bind(db);
			jest
				.spyOn(db, 'sql')
				.mockImplementation(async (queryType: string, params, ...args) => {
					if (queryType === 'applicationForms.selectById') {
						return {
							rows: [{ foo: 'not a valid result' }],
						} as Result<object>;
					}
					return unmockedDbSqlFunction(queryType, params, ...args);
				});

			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					fieldValues: [],
				})
				.expect(500);
			expect(result.body).toMatchObject({
				name: 'InternalValidationError',
				message:
					'The database responded with an unexpected format when looking up the Application Form.',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 500 if the database returns an unexpected data structure when selecting the proposal for validation', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' );
      `);
			const unmockedDbSqlFunction = db.sql.bind(db);
			jest
				.spyOn(db, 'sql')
				.mockImplementation(async (queryType: string, params, ...args) => {
					if (queryType === 'proposals.selectById') {
						return {
							rows: [{ foo: 'not a valid result' }],
						} as Result<object>;
					}
					return unmockedDbSqlFunction(queryType, params, ...args);
				});

			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					fieldValues: [],
				})
				.expect(500);
			expect(result.body).toMatchObject({
				name: 'InternalValidationError',
				message:
					'The database responded with an unexpected format when looking up the Proposal.',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 500 if the database returns an unexpected data structure when selecting the application form field for validation', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' );
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
          ( 1, 1, 1, 'First Name', '2022-07-20 12:00:00+0000' ),
          ( 1, 2, 2, 'Last Name', '2022-07-20 12:00:00+0000' );
      `);
			const unmockedDbSqlFunction = db.sql.bind(db);
			jest
				.spyOn(db, 'sql')
				.mockImplementation(async (queryType: string, params, ...args) => {
					if (queryType === 'applicationFormFields.selectById') {
						return {
							rows: [{ foo: 'not a valid result' }],
						} as Result<object>;
					}
					return unmockedDbSqlFunction(queryType, params, ...args);
				});

			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					fieldValues: [
						{
							applicationFormFieldId: 1,
							position: 1,
							value: 'Gronald',
						},
					],
				})
				.expect(500);
			expect(result.body).toMatchObject({
				name: 'InternalValidationError',
				message:
					'The database responded with an unexpected format when looking up the Application Form Field.',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 503 DatabaseError if an insufficient resources database error is thrown when selecting the application form field for validation', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' );
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
          ( 1, 1, 1, 'First Name', '2022-07-20 12:00:00+0000' ),
          ( 1, 2, 2, 'Last Name', '2022-07-20 12:00:00+0000' );
      `);
			const unmockedDbSqlFunction = db.sql.bind(db);
			jest
				.spyOn(db, 'sql')
				.mockImplementation(async (queryType: string, params, ...args) => {
					if (queryType === 'applicationFormFields.selectById') {
						throw new TinyPgError('Something went wrong', undefined, {
							error: {
								code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
							},
						});
					}
					return unmockedDbSqlFunction(queryType, params, ...args);
				});
			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					fieldValues: [
						{
							applicationFormFieldId: 1,
							position: 1,
							value: 'Gronald',
						},
					],
				})
				.expect(503);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
				details: [
					{
						code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
					},
				],
			});
		});

		it('returns 500 if the database returns an unexpected data structure when inserting the proposal version', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' );
      `);
			const unmockedDbSqlFunction = db.sql.bind(db);
			jest
				.spyOn(db, 'sql')
				.mockImplementation(async (queryType: string, params, ...args) => {
					if (queryType === 'proposalVersions.insertOne') {
						return {
							rows: [{ foo: 'not a valid result' }],
						} as Result<object>;
					}
					return unmockedDbSqlFunction(queryType, params, ...args);
				});

			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					fieldValues: [],
				})
				.expect(500);
			expect(result.body).toMatchObject({
				name: 'InternalValidationError',
				message:
					'The database responded with an unexpected format when creating the Proposal Version.',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 500 if the database returns an unexpected data structure when inserting a proposal field value', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' );
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
          ( 1, 1, 1, 'First Name', '2022-07-20 12:00:00+0000' ),
          ( 1, 2, 2, 'Last Name', '2022-07-20 12:00:00+0000' );
      `);
			const unmockedDbSqlFunction = db.sql.bind(db);
			jest
				.spyOn(db, 'sql')
				.mockImplementation(async (queryType: string, params, ...args) => {
					if (queryType === 'proposalFieldValues.insertOne') {
						return {
							rows: [{ foo: 'not a valid result' }],
						} as Result<object>;
					}
					return unmockedDbSqlFunction(queryType, params, ...args);
				});

			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					fieldValues: [
						{
							applicationFormFieldId: 1,
							position: 1,
							value: 'Gronald',
						},
						{
							applicationFormFieldId: 2,
							position: 1,
							value: 'Plorp',
						},
					],
				})
				.expect(500);
			expect(result.body).toMatchObject({
				name: 'InternalValidationError',
				message:
					'The database responded with an unexpected format when creating the Proposal Field Value.',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 503 DatabaseError if an insufficient resources database error is thrown when inserting a proposal version', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' );
      `);
			const unmockedDbSqlFunction = db.sql.bind(db);
			jest
				.spyOn(db, 'sql')
				.mockImplementation(async (queryType: string, params, ...args) => {
					if (queryType === 'proposalVersions.insertOne') {
						throw new TinyPgError('Something went wrong', undefined, {
							error: {
								code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
							},
						});
					}
					return unmockedDbSqlFunction(queryType, params, ...args);
				});
			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					fieldValues: [],
				})
				.expect(503);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
				details: [
					{
						code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
					},
				],
			});
		});

		it('returns 503 DatabaseError if an insufficient resources database error is thrown when inserting a proposal field value', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' );
      `);
			await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' );
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' );
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
          ( 1, 1, 1, 'First Name', '2022-07-20 12:00:00+0000' ),
          ( 1, 2, 2, 'Last Name', '2022-07-20 12:00:00+0000' );
      `);
			const unmockedDbSqlFunction = db.sql.bind(db);
			jest
				.spyOn(db, 'sql')
				.mockImplementation(async (queryType: string, params, ...args) => {
					if (queryType === 'proposalFieldValues.insertOne') {
						throw new TinyPgError('Something went wrong', undefined, {
							error: {
								code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
							},
						});
					}
					return unmockedDbSqlFunction(queryType, params, ...args);
				});
			const result = await agent
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					fieldValues: [
						{
							applicationFormFieldId: 1,
							position: 1,
							value: 'Gronald',
						},
						{
							applicationFormFieldId: 2,
							position: 1,
							value: 'Plorp',
						},
					],
				})
				.expect(503);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
				details: [
					{
						code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
					},
				],
			});
		});
	});
});
