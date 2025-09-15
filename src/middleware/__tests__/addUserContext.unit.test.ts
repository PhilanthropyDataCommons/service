import { InputValidationError } from '../../errors';
import { getMockRequest, getMockResponse } from '../../test/mockExpress';
import { addUserContext } from '../addUserContext';
import type { AuthenticatedRequest } from '../../types';

jest.mock('../../config', () => ({
	getSystemUser: () => ({
		sub: '00000000-0000-0000-0000-000000000000',
		name: 'Unknown',
	}),
}));
describe('addUserContext (unit)', () => {
	it('calls next with an InputValidationError when no `name` is in the JWT', () => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		const mockAuthExp = Math.round(new Date().getTime() / 1000) + 3600;
		req.auth = {
			sub: '45131d6f-3ec3-4953-bd71-9e61b31e842a',
			exp: mockAuthExp,
		};
		let argToNext: unknown = null;
		addUserContext(req, res, (err: unknown) => {
			argToNext = err;
		});
		expect(argToNext).toBeInstanceOf(InputValidationError);
	});
});
