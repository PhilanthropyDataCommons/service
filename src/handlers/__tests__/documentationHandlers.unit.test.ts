import fs from 'fs/promises';
import { issuer } from '../../auth/jwtOptions';
import { documentationHandlers } from '../documentationHandlers';
import type { Request, Response } from 'express';

jest.mock('fs/promises');

describe('documentationHandlers', () => {
	describe('getRootApiSpec', () => {
		it('should return expanded file content', async () => {
			jest
				.spyOn(fs, 'readFile')
				.mockResolvedValue('{ "foo": "{{AUTH_ISSUER}}" }');
			const sendMock = jest.fn();
			await documentationHandlers.getRootApiSpec(
				{} as Request,
				{
					type: () => {},
					set: () => {},
					send: sendMock,
				} as unknown as Response,
			);
			expect(sendMock).toHaveBeenCalledWith(`{ "foo": "${issuer}" }`);
		});
	});
});
