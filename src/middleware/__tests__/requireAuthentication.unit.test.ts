import { getMockRequest, getMockResponse } from '../../test/mockExpress';
import { requireAuthentication } from '../requireAuthentication';
import { UnauthorizedError } from '../../errors';
import type { Request as JwtRequest } from 'express-jwt';

describe('requireAuthentication (unit)', () => {
	it('calls next with an UnauthorizedError when no `name` is in the JWT', () => {
		// Because `requireAuthentication` is used to verify that `auth` exists, it
		// would not make sense to make `req` an `AuthenticatedRequest` here.
		const req = getMockRequest() as JwtRequest;
		const res = getMockResponse();
		const mockAuthExp = Math.round(new Date().getTime() / 1000) + 3600;
		req.auth = {
			sub: '3cbe4293-3dcc-463f-8749-488e189aae5a',
			exp: mockAuthExp,
		};
		let argToNext: unknown = null;
		requireAuthentication(req, res, (err: unknown) => {
			argToNext = err;
		});
		expect(argToNext).toBeInstanceOf(UnauthorizedError);
	});
});
