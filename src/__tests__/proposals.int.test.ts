import request from 'supertest';
import { app } from '../app';
import {
	createProposal,
	db,
	loadTableMetrics,
} from '../database';
import { getLogger } from '../logger';
import { expectTimestamp } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';
import { PostgresErrorCode } from '../types/PostgresErrorCode';

const logger = getLogger(__filename);
const agent = request.agent(app);

const createTestBaseFields = async () => {
	await db.sql('baseFields.insertOne', {
		label: 'Summary',
		description: 'A summary of the proposal',
		shortCode: 'summary',
		dataType: 'string',
	});
	await db.sql('baseFields.insertOne', {
		label: 'Title',
		description: 'The title of the proposal',
		shortCode: 'title',
		dataType: 'string',
	});
};

describe('/proposals', () => {
	describe('GET /', () => {
		logger.debug('Now running an proposals test');
		it('returns an empty Bundle when no data is present', async () => {
			const response = await agent
				.get('/proposals')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 0,
				entries: [],
			});
		});

		it('returns proposals present in the database', async () => {
			await db.sql('opportunities.insertOne', {
				title: '🔥',
			});
			await createTestBaseFields();
			await createProposal({
				externalId: 'proposal-1',
				opportunityId: 1,
			});
			await createProposal({
				externalId: 'proposal-2',
				opportunityId: 1,
			});
			await db.sql('applicationForms.insertOne', {
				opportunityId: 1,
			});
			await db.sql('proposalVersions.insertOne', {
				proposalId: 1,
				applicationFormId: 1,
			});
			await db.sql('applicationFormFields.insertOne', {
				applicationFormId: 1,
				baseFieldId: 1,
				position: 1,
				label: 'Short summary',
			});
			await db.sql('proposalFieldValues.insertOne', {
				proposalVersionId: 1,
				applicationFormFieldId: 1,
				position: 1,
				value: 'This is a summary',
			});

			const response = await agent
				.get('/proposals')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: [
					{
						id: 2,
						externalId: 'proposal-2',
						opportunityId: 1,
						createdAt: expectTimestamp,
						versions: [],
					},
					{
						id: 1,
						externalId: 'proposal-1',
						opportunityId: 1,
						createdAt: expectTimestamp,
						versions: [
							{
								id: 1,
								proposalId: 1,
								version: 1,
								applicationFormId: 1,
								createdAt: expectTimestamp,
								fieldValues: [
									{
										id: 1,
										applicationFormFieldId: 1,
										proposalVersionId: 1,
										position: 1,
										value: 'This is a summary',
										createdAt: expectTimestamp,
										applicationFormField: {
											id: 1,
											applicationFormId: 1,
											baseFieldId: 1,
											baseField: {
												createdAt: expectTimestamp,
												dataType: 'string',
												description: 'A summary of the proposal',
												id: 1,
												label: 'Summary',
												shortCode: 'summary',
											},
											label: 'Short summary',
											position: 1,
											createdAt: expectTimestamp,
										},
									},
								],
							},
						],
					},
				],
			});
		});

		it('returns a subset of proposals present in the database when search is provided', async () => {
			await db.sql('opportunities.insertOne', {
				title: '🔥',
			});

			await createTestBaseFields();
			await createProposal({
				externalId: 'proposal-1',
				opportunityId: 1,
			});
			await createProposal({
				externalId: 'proposal-2',
				opportunityId: 1,
			});
			await db.sql('applicationForms.insertOne', {
				opportunityId: 1,
			});
			await db.sql('proposalVersions.insertOne', {
				proposalId: 1,
				applicationFormId: 1,
			});
			await db.sql('proposalVersions.insertOne', {
				proposalId: 2,
				applicationFormId: 1,
			});
			await db.sql('applicationFormFields.insertOne', {
				applicationFormId: 1,
				baseFieldId: 1,
				position: 1,
				label: 'Short summary',
			});
			await db.sql('proposalFieldValues.insertOne', {
				proposalVersionId: 1,
				applicationFormFieldId: 1,
				position: 1,
				value: 'This is a summary',
			});
			await db.sql('proposalFieldValues.insertOne', {
				proposalVersionId: 2,
				applicationFormFieldId: 1,
				position: 1,
				value: 'This is a pair of pants',
			});
			const response = await agent
				.get('/proposals?_content=summary')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: [
					{
						id: 1,
						externalId: 'proposal-1',
						opportunityId: 1,
						createdAt: expectTimestamp,
						versions: [
							{
								id: 1,
								proposalId: 1,
								version: 1,
								applicationFormId: 1,
								createdAt: expectTimestamp,
								fieldValues: [
									{
										id: 1,
										applicationFormFieldId: 1,
										proposalVersionId: 1,
										position: 1,
										value: 'This is a summary',
										createdAt: expectTimestamp,
										applicationFormField: {
											id: 1,
											applicationFormId: 1,
											baseFieldId: 1,
											baseField: {
												createdAt: expectTimestamp,
												dataType: 'string',
												description: 'A summary of the proposal',
												id: 1,
												label: 'Summary',
												shortCode: 'summary',
											},
											label: 'Short summary',
											position: 1,
											createdAt: expectTimestamp,
										},
									},
								],
							},
						],
					},
				],
			});
		});

		it('returns a subset of proposals present in the database when search is provided - tscfg simple', async () => {
			// This should pass even if the default text search config is 'simple'.
			// See https://github.com/PhilanthropyDataCommons/service/issues/336
			await db.query("set default_text_search_config = 'simple';");
			await db.sql('opportunities.insertOne', {
				title: 'Grand opportunity',
			});
			await createTestBaseFields();
			await createProposal({
				externalId: 'proposal-4999',
				opportunityId: 1,
			});
			await createProposal({
				externalId: 'proposal-5003',
				opportunityId: 1,
			});
			await db.sql('applicationForms.insertOne', {
				opportunityId: 1,
			});
			await db.sql('proposalVersions.insertOne', {
				proposalId: 1,
				applicationFormId: 1,
			});
			await db.sql('proposalVersions.insertOne', {
				proposalId: 2,
				applicationFormId: 1,
			});
			await db.sql('applicationFormFields.insertOne', {
				applicationFormId: 1,
				baseFieldId: 1,
				position: 1,
				label: 'Concise summary',
			});
			await db.sql('proposalFieldValues.insertOne', {
				proposalVersionId: 1,
				applicationFormFieldId: 1,
				position: 1,
				value: 'This is a summary',
			});
			await db.sql('proposalFieldValues.insertOne', {
				proposalVersionId: 2,
				applicationFormFieldId: 1,
				position: 1,
				value: 'This is a pair of pants',
			});
			const response = await agent
				.get('/proposals?_content=summary')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: [
					{
						id: 1,
						externalId: 'proposal-4999',
						opportunityId: 1,
						createdAt: expectTimestamp,
						versions: [
							{
								id: 1,
								proposalId: 1,
								version: 1,
								applicationFormId: 1,
								createdAt: expectTimestamp,
								fieldValues: [
									{
										id: 1,
										applicationFormFieldId: 1,
										proposalVersionId: 1,
										position: 1,
										value: 'This is a summary',
										createdAt: expectTimestamp,
										applicationFormField: {
											id: 1,
											applicationFormId: 1,
											baseFieldId: 1,
											baseField: {
												createdAt: expectTimestamp,
												dataType: 'string',
												description: 'A summary of the proposal',
												id: 1,
												label: 'Summary',
												shortCode: 'summary',
											},
											label: 'Concise summary',
											position: 1,
											createdAt: expectTimestamp,
										},
									},
								],
							},
						],
					},
				],
			});
		});

		it('returns according to pagination parameters', async () => {
			await db.sql('opportunities.insertOne', {
				title: '🔥',
			});
			await Array.from(Array(20)).reduce(async (p, _, i) => {
				await p;
				await createProposal({
					externalId: `proposal-${i + 1}`,
					opportunityId: 1,
				});
			}, Promise.resolve());
			const response = await agent
				.get('/proposals')
				.query({
					_page: 2,
					_count: 5,
				})
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 20,
				entries: [
					{
						id: 15,
						externalId: 'proposal-15',
						opportunityId: 1,
						versions: [],
						createdAt: expectTimestamp,
					},
					{
						id: 14,
						externalId: 'proposal-14',
						opportunityId: 1,
						versions: [],
						createdAt: expectTimestamp,
					},
					{
						id: 13,
						externalId: 'proposal-13',
						opportunityId: 1,
						versions: [],
						createdAt: expectTimestamp,
					},
					{
						id: 12,
						externalId: 'proposal-12',
						opportunityId: 1,
						versions: [],
						createdAt: expectTimestamp,
					},
					{
						id: 11,
						externalId: 'proposal-11',
						opportunityId: 1,
						versions: [],
						createdAt: expectTimestamp,
					},
				],
			});
		});
	});

	describe('GET /:id', () => {
		it('returns 404 when given id is not present', async () => {
			const response = await agent
				.get('/proposals/9001')
				.set(authHeader)
				.expect(404);
			expect(response.body).toEqual({
				name: 'NotFoundError',
				message: expect.any(String) as string,
				details: [
					{
						name: 'NotFoundError',
					},
				],
			});
		});

		it('returns 400 when given id a string', async () => {
			const response = await agent
				.get('/proposals/foobar')
				.set(authHeader)
				.expect(400);
			expect(response.body).toEqual({
				name: 'InputValidationError',
				message: expect.any(String) as string,
				details: [],
			});
		});

		it('returns the one proposal asked for', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '⛰️', '2525-01-03T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO proposals (
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 'proposal-1', 1, '2525-01-03T00:00:04Z' ),
          ( 'proposal-2', 1, '2525-01-03T00:00:05Z' );
      `);
			const response = await agent
				.get('/proposals/2')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				id: 2,
				externalId: 'proposal-2',
				versions: [],
				opportunityId: 1,
				createdAt: expectTimestamp,
			});
		});

		it('returns one proposal with deep fields', async () => {
			await createTestBaseFields();
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🌎', '2525-01-04T00:00:01Z' )
      `);
			await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2525-01-04T00:00:04Z' )
      `);
			await db.query(`
        INSERT INTO application_form_fields (
          application_form_id,
          base_field_id,
          position,
          label,
          created_at
        )
        VALUES
          ( 1, 2, 1, 'Short summary or title', '2525-01-04T00:00:05Z' ),
          ( 1, 1, 2, 'Long summary or abstract', '2525-01-04T00:00:06Z' );
      `);
			await db.query(`
        INSERT INTO proposals (
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 'proposal-2525-01-04T00Z', 1, '2525-01-04T00:00:07Z' );
      `);
			await db.query(`
        INSERT INTO proposal_versions (
          proposal_id,
          application_form_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, 1, '2525-01-04T00:00:08Z' ),
          ( 1, 1, 2, '2525-01-04T00:00:09Z' );
      `);
			await db.query(`
        INSERT INTO proposal_field_values (
          proposal_version_id,
          application_form_field_id,
          position,
          value,
          created_at
        )
        VALUES
          ( 1, 1, 1, 'Title for version 1 from 2525-01-04', '2525-01-04T00:00:10Z' ),
          ( 1, 2, 2, 'Abstract for version 1 from 2525-01-04', '2525-01-04T00:00:11Z' ),
          ( 2, 1, 1, 'Title for version 2 from 2525-01-04', '2525-01-04T00:00:12Z' ),
          ( 2, 2, 2, 'Abstract for version 2 from 2525-01-04', '2525-01-04T00:00:13Z' );
      `);
			const response = await agent
				.get('/proposals/1')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				id: 1,
				opportunityId: 1,
				externalId: 'proposal-2525-01-04T00Z',
				createdAt: expectTimestamp,
				versions: [
					{
						id: 2,
						proposalId: 1,
						applicationFormId: 1,
						version: 2,
						createdAt: expectTimestamp,
						fieldValues: [
							{
								id: 3,
								proposalVersionId: 2,
								applicationFormFieldId: 1,
								position: 1,
								value: 'Title for version 2 from 2525-01-04',
								createdAt: expectTimestamp,
								applicationFormField: {
									id: 1,
									applicationFormId: 1,
									baseFieldId: 2,
									baseField: {
										createdAt: expectTimestamp,
										dataType: 'string',
										description: 'The title of the proposal',
										id: 2,
										label: 'Title',
										shortCode: 'title',
									},
									position: 1,
									label: 'Short summary or title',
									createdAt: expectTimestamp,
								},
							},
							{
								id: 4,
								proposalVersionId: 2,
								applicationFormFieldId: 2,
								position: 2,
								value: 'Abstract for version 2 from 2525-01-04',
								createdAt: expectTimestamp,
								applicationFormField: {
									id: 2,
									applicationFormId: 1,
									baseFieldId: 1,
									baseField: {
										createdAt: expectTimestamp,
										dataType: 'string',
										description: 'A summary of the proposal',
										id: 1,
										label: 'Summary',
										shortCode: 'summary',
									},
									position: 2,
									label: 'Long summary or abstract',
									createdAt: expectTimestamp,
								},
							},
						],
					},
					{
						id: 1,
						proposalId: 1,
						applicationFormId: 1,
						version: 1,
						createdAt: expectTimestamp,
						fieldValues: [
							{
								id: 1,
								proposalVersionId: 1,
								applicationFormFieldId: 1,
								position: 1,
								value: 'Title for version 1 from 2525-01-04',
								createdAt: expectTimestamp,
								applicationFormField: {
									id: 1,
									applicationFormId: 1,
									baseFieldId: 2,
									baseField: {
										createdAt: expectTimestamp,
										dataType: 'string',
										description: 'The title of the proposal',
										id: 2,
										label: 'Title',
										shortCode: 'title',
									},
									position: 1,
									label: 'Short summary or title',
									createdAt: expectTimestamp,
								},
							},
							{
								id: 2,
								proposalVersionId: 1,
								applicationFormFieldId: 2,
								position: 2,
								value: 'Abstract for version 1 from 2525-01-04',
								createdAt: expectTimestamp,
								applicationFormField: {
									id: 2,
									applicationFormId: 1,
									baseFieldId: 1,
									baseField: {
										createdAt: expectTimestamp,
										dataType: 'string',
										description: 'A summary of the proposal',
										id: 1,
										label: 'Summary',
										shortCode: 'summary',
									},
									position: 2,
									label: 'Long summary or abstract',
									createdAt: expectTimestamp,
								},
							},
						],
					},
				],
			});
		});
	});

	describe('POST /', () => {
		it('creates exactly one proposal', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
			const before = await loadTableMetrics('proposals');
			logger.debug('before: %o', before);
			const result = await agent
				.post('/proposals')
				.type('application/json')
				.set(authHeader)
				.send({
					externalId: 'proposal123',
					opportunityId: 1,
				})
				.expect(201);
			const after = await loadTableMetrics('proposals');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: 1,
				externalId: 'proposal123',
				opportunityId: 1,
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});

		it('returns 400 bad request when no external ID is sent', async () => {
			const result = await agent
				.post('/proposals')
				.type('application/json')
				.set(authHeader)
				.send({
					opportunityId: 1,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no opportunity ID is sent', async () => {
			const result = await agent
				.post('/proposals')
				.type('application/json')
				.set(authHeader)
				.send({
					externalId: 'proposal123',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 409 conflict when a non-existent opportunity id is provided', async () => {
			const result = await agent
				.post('/proposals')
				.type('application/json')
				.set(authHeader)
				.send({
					externalId: 'proposal123',
					opportunityId: 1,
				})
				.expect(409);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
				details: [
					{
						code: PostgresErrorCode.FOREIGN_KEY_VIOLATION,
						constraint: 'fk_opportunity',
					},
				],
			});
		});
	});
});
