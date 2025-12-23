import request from 'supertest';
import { app } from '../app';
import { db, createChangemaker, createSource } from '../database';
import { expectNumber, expectTimestamp } from '../test/asymettricMatchers';
import { mockJwt as authHeader } from '../test/mockJwt';

describe('POST /changemakerFieldValueBatches', () => {
	it('Successfully creates a changemaker field value batch', async () => {
		const changemaker = await createChangemaker(db, null, {
			taxId: '11-1111111',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const source = await createSource(db, null, {
			label: 'Test Source',
			changemakerId: changemaker.id,
		});

		const result = await request(app)
			.post('/changemakerFieldValueBatches')
			.type('application/json')
			.set(authHeader)
			.send({
				sourceId: source.id,
				notes: 'Routine annual import',
			})
			.expect(201);

		expect(result.body).toMatchObject({
			id: expectNumber(),
			sourceId: source.id,
			notes: 'Routine annual import',
			createdAt: expectTimestamp(),
			source: {
				id: source.id,
				label: 'Test Source',
			},
		});
	});

	it('Accepts null for notes', async () => {
		const changemaker = await createChangemaker(db, null, {
			taxId: '22-2222222',
			name: 'Test Organization',
			keycloakOrganizationId: null,
		});

		const source = await createSource(db, null, {
			label: 'Test Source',
			changemakerId: changemaker.id,
		});

		const result = await request(app)
			.post('/changemakerFieldValueBatches')
			.type('application/json')
			.set(authHeader)
			.send({
				sourceId: source.id,
				notes: null,
			})
			.expect(201);

		expect(result.body).toMatchObject({
			id: expectNumber(),
			sourceId: source.id,
			notes: null,
			createdAt: expectTimestamp(),
		});
	});

	it('Returns 400 when request body is invalid', async () => {
		const result = await request(app)
			.post('/changemakerFieldValueBatches')
			.type('application/json')
			.set(authHeader)
			.send({
				// Missing required sourceId
				notes: 'Test notes',
			})
			.expect(400);

		expect(result.body).toMatchObject({
			name: 'InputValidationError',
		});
	});

	it('Returns 400 when sourceId is not an integer', async () => {
		const result = await request(app)
			.post('/changemakerFieldValueBatches')
			.type('application/json')
			.set(authHeader)
			.send({
				sourceId: 'not-a-number',
				notes: 'Test notes',
			})
			.expect(400);

		expect(result.body).toMatchObject({
			name: 'InputValidationError',
		});
	});

	it('Returns 401 when not authenticated', async () => {
		await request(app)
			.post('/changemakerFieldValueBatches')
			.type('application/json')
			.send({
				sourceId: 1,
				notes: 'Test notes',
			})
			.expect(401);
	});

	it('Returns 409 when source does not exist', async () => {
		const result = await request(app)
			.post('/changemakerFieldValueBatches')
			.type('application/json')
			.set(authHeader)
			.send({
				sourceId: 999999,
				notes: 'Test notes',
			})
			.expect(409);

		expect(result.body).toMatchObject({
			name: 'InputConflictError',
			message: 'The source does not exist.',
		});
	});
});
