import fs from 'fs/promises';
import { issuer } from '../../auth/jwtOptions';
import { documentationHandlers } from '../documentationHandlers';
import { getMockRequest, getMockResponse } from '../../test/mockExpress';

jest.mock('fs/promises');

describe('documentationHandlers', () => {
	describe('getRootApiSpec', () => {
		it('should return expanded file content', async () => {
			jest
				.spyOn(fs, 'readFile')
				.mockResolvedValue('{ "foo": "{{AUTH_ISSUER}}" }');
			const req = getMockRequest();
			const res = getMockResponse();
			await documentationHandlers.getRootApiSpec(req, res);
			expect(res.send).toHaveBeenCalledWith(`{ "foo": "${issuer}" }`);
		});
	});
	describe('getAuthApiSpec', () => {
		it('should return expanded file content', async () => {
			jest
				.spyOn(fs, 'readFile')
				.mockResolvedValue('{ "foo": "{{AUTH_ISSUER}}" }');
			const req = getMockRequest();
			const res = getMockResponse();
			await documentationHandlers.getRootApiSpec(req, res);
			expect(res.send).toHaveBeenCalledWith(`{ "foo": "${issuer}" }`);
		});
	});
});
