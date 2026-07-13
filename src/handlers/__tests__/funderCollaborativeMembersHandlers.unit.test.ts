import { funderCollaborativeMembersHandlers } from '../funderCollaborativeMembersHandlers';
import { FailedMiddlewareError } from '../../errors';
import { getMockRequest, getMockResponse } from '../../test/mockExpress';

describe('funderCollaborativeMembersHandlers', () => {
	describe('getFunderCollaboratives', () => {
		it('throws a FailedMiddlewareError when the request lacks an auth context', async () => {
			const req = getMockRequest();
			const res = getMockResponse();
			await expect(
				funderCollaborativeMembersHandlers.getFunderCollaboratives(req, res),
			).rejects.toThrow(FailedMiddlewareError);
		});
	});
});
