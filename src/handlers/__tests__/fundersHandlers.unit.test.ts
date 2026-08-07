import { fundersHandlers } from '../fundersHandlers';
import { FailedMiddlewareError } from '../../errors';
import { getMockRequest, getMockResponse } from '../../test/mockExpress';

describe('fundersHandlers', () => {
	describe('getFunders', () => {
		it('throws a FailedMiddlewareError when the request lacks an auth context', async () => {
			const req = getMockRequest();
			const res = getMockResponse();
			await expect(fundersHandlers.getFunders(req, res)).rejects.toThrow(
				FailedMiddlewareError,
			);
		});
	});

	describe('getFunder', () => {
		it('throws a FailedMiddlewareError when the request lacks an auth context', async () => {
			const req = getMockRequest();
			const res = getMockResponse();
			await expect(fundersHandlers.getFunder(req, res)).rejects.toThrow(
				FailedMiddlewareError,
			);
		});
	});

	describe('putFunder', () => {
		it('throws a FailedMiddlewareError when the request lacks an auth context', async () => {
			const req = getMockRequest();
			const res = getMockResponse();
			await expect(fundersHandlers.putFunder(req, res)).rejects.toThrow(
				FailedMiddlewareError,
			);
		});
	});
});
