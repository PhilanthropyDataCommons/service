import request from 'supertest';
import { TinyPgError } from 'tinypg';
import { app } from '../app';
import { db, loadTableMetrics } from '../database';
import { getLogger } from '../logger';
import { PostgresErrorCode } from '../types';
import { expectTimestamp } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';
import type { Result } from 'tinypg';

const logger = getLogger(__filename);
const agent = request.agent(app);

describe('/applicants', () => {
	describe('GET /', () => {
		it('returns an empty array when no data is present', async () => {
			await agent.get('/applicants').set(authHeader).expect(200, []);
		});

		it('sends UnauthorizedError when no JWT is sent', async () => {
			const result = await agent.get('/applicants').expect(401);
			expect(result.body).toMatchObject({
				name: 'UnauthorizedError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns all applicants present in the database', async () => {
			await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' ),
          ( '67890', 'false', '2022-07-20 12:00:00+0000' );
      `);
			await agent
				.get('/applicants')
				.set(authHeader)
				.expect(200, [
					{
						createdAt: '2022-07-20T12:00:00.000Z',
						externalId: '12345',
						id: 1,
						optedIn: true,
					},
					{
						createdAt: '2022-07-20T12:00:00.000Z',
						externalId: '67890',
						id: 2,
						optedIn: false,
					},
				]);
		});

		it('should error if the database returns an unexpected data structure', async () => {
			jest.spyOn(db, 'sql').mockImplementationOnce(
				async () =>
					({
						rows: [{ foo: 'not a valid result' }],
					}) as Result<object>,
			);
			const result = await agent.get('/applicants').set(authHeader).expect(500);
			expect(result.body).toMatchObject({
				name: 'InternalValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 500 UnknownError if a generic Error is thrown when selecting', async () => {
			jest.spyOn(db, 'sql').mockImplementationOnce(async () => {
				throw new Error('This is unexpected');
			});
			const result = await agent.get('/applicants').set(authHeader).expect(500);
			expect(result.body).toMatchObject({
				name: 'UnknownError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 503 DatabaseError if an insufficient resources database error is thrown when selecting', async () => {
			jest.spyOn(db, 'sql').mockImplementationOnce(async () => {
				throw new TinyPgError('Something went wrong', undefined, {
					error: {
						code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
					},
				});
			});
			const result = await agent.get('/applicants').set(authHeader).expect(503);
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

	describe('POST /', () => {
		it('creates exactly one applicant', async () => {
			const before = await loadTableMetrics('applicants');
			logger.debug('before: %o', before);
			const result = await agent
				.post('/applicants')
				.type('application/json')
				.set(authHeader)
				.send({
					externalId: '🆔',
				})
				.expect(201);
			const after = await loadTableMetrics('applicants');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: expect.any(Number) as number,
				externalId: '🆔',
				optedIn: false,
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});
		it('returns 400 bad request when no external id is provided', async () => {
			const result = await agent
				.post('/applicants')
				.type('application/json')
				.set(authHeader)
				.send({})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});
		it('returns 409 conflict when a duplicate external id is submitted', async () => {
			await db.query(`
        INSERT INTO applicants (external_id)
        VALUES ( '12345' );
      `);
			const result = await agent
				.post('/applicants')
				.type('application/json')
				.set(authHeader)
				.send({
					externalId: '12345',
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
		it('returns 500 if the database returns an unexpected data structure', async () => {
			jest.spyOn(db, 'sql').mockImplementationOnce(
				async () =>
					({
						rows: [{ foo: 'not a valid result' }],
					}) as Result<object>,
			);
			const result = await agent
				.post('/applicants')
				.type('application/json')
				.set(authHeader)
				.send({
					externalId: '12345',
				})
				.expect(500);
			expect(result.body).toMatchObject({
				name: 'InternalValidationError',
				details: expect.any(Array) as unknown[],
			});
		});
	});
});
