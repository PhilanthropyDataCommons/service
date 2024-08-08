import request from 'supertest';
import { app } from '../app';
import {
	createOrganization,
	createSource,
	loadSystemSource,
	loadTableMetrics,
} from '../database';
import { expectTimestamp } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';
import { SourceType } from '../types';

const agent = request.agent(app);

describe('/sources', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/sources').expect(401);
		});

		it('returns the system source when no data has been added', async () => {
			const systemSource = await loadSystemSource();
			await agent
				.get('/sources')
				.set(authHeader)
				.expect(200, {
					entries: [systemSource],
					total: 1,
				});
		});

		it('returns all sources present in the database', async () => {
			const systemSource = await loadSystemSource();
			const organization = await createOrganization({
				taxId: '11-1111111',
				name: 'Example Inc.',
			});
			const source = await createSource({
				sourceType: SourceType.ORGANIZATION,
				label: 'Example Inc.',
				relatedEntityId: organization.id,
			});
			const response = await agent.get('/sources').set(authHeader).expect(200);
			expect(response.body).toEqual({
				entries: [source, systemSource],
				total: 2,
			});
		});
	});

	describe('GET /:id', () => {
		it('requires authentication', async () => {
			await agent.get('/sources/1').expect(401);
		});

		it('returns exactly one source selected by id', async () => {
			const organization = await createOrganization({
				taxId: '11-1111111',
				name: 'Example Inc.',
			});
			const source = await createSource({
				sourceType: SourceType.ORGANIZATION,
				label: 'Example Inc.',
				relatedEntityId: organization.id,
			});

			const response = await agent
				.get(`/sources/${source.id}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual(source);
		});

		it('returns 400 bad request when id is a letter', async () => {
			const result = await agent.get('/sources/a').set(authHeader).expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when id is a number greater than 2^32-1', async () => {
			const result = await agent
				.get('/sources/555555555555555555555555555555')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 404 when id is not found', async () => {
			const organization = await createOrganization({
				taxId: '11-1111111',
				name: 'Example Inc.',
			});
			await createSource({
				sourceType: SourceType.ORGANIZATION,
				label: 'not to be returned',
				relatedEntityId: organization.id,
			});
			await agent.get('/sources/9001').set(authHeader).expect(404);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await agent.post('/sources').expect(401);
		});

		it('creates and returns exactly one source', async () => {
			const organization = await createOrganization({
				taxId: '11-1111111',
				name: 'Example Inc.',
			});
			const before = await loadTableMetrics('sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					sourceType: 'organization',
					label: 'Example Corp',
					relatedEntityId: organization.id,
				})
				.expect(201);
			const after = await loadTableMetrics('sources');
			expect(before.count).toEqual(1);
			expect(result.body).toMatchObject({
				id: 2,
				sourceType: 'organization',
				label: 'Example Corp',
				relatedEntityId: organization.id,
				relatedEntity: organization,
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(2);
		});

		it('returns 400 bad request when no sourceType sent', async () => {
			const organization = await createOrganization({
				taxId: '11-1111111',
				name: 'Example Inc.',
			});
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'Example Corp',
					relatedEntityId: organization.id,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no label sent', async () => {
			const organization = await createOrganization({
				taxId: '11-1111111',
				name: 'Example Inc.',
			});
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					sourceType: 'organization',
					relatedEntityId: organization.id,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no relatedEntityId sent', async () => {
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					sourceType: 'organization',
					label: 'Example Corp',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});
	});
});
