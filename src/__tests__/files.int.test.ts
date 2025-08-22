import request from 'supertest';
import { app } from '../app';
import { mockJwt as authHeader } from '../test/mockJwt';
import {
	expectUuid,
	expectString,
	expectTimestamp,
} from '../test/asymettricMatchers';

describe('/files', () => {
	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/files').expect(401);
		});

		it('creates a file and returns it with a generated GUID', async () => {
			const result = await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({
					mimeType: 'application/pdf',
					size: 1024,
				})
				.expect(201);

			expect(result.body).toMatchObject({
				mimeType: 'application/pdf',
				size: 1024,
				guid: expectUuid(),
				createdBy: expectString(),
				createdAt: expectTimestamp(),
			});
		});

		it('returns 400 when mimeType is missing', async () => {
			await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({
					size: 1024,
				})
				.expect(400);
		});

		it('returns 400 when size is missing', async () => {
			await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({
					mimeType: 'application/pdf',
				})
				.expect(400);
		});

		it('returns 400 when size is negative', async () => {
			await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({
					mimeType: 'application/pdf',
					size: -1,
				})
				.expect(400);
		});

		it('returns 400 when request body is empty', async () => {
			await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({})
				.expect(400);
		});
	});
});
