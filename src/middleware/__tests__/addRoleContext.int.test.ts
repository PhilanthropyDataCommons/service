import { addRoleContext } from '../addRoleContext';
import { generateNextWithAssertions } from '../../test/utils';
import { getMockRequest, getMockResponse } from '../../test/mockExpress';
import type { AuthenticatedRequest } from '../../types';

describe('addRoleContext', () => {
	it('Assigns the administrator role if pdc-admin is in the auth roles', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			realm_access: {
				roles: ['pdc-admin'],
			},
		};

		const runAssertions = async (err: unknown) => {
			expect(err).toBe(undefined);
			expect(req.role?.isAdministrator).toBe(true);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addRoleContext(req, res, nextMock);
	});

	it('Does NOT assign the administrator role if pdc-admin is not the auth roles', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			realm_access: {
				roles: ['not-pdc-admin'],
			},
		};

		const runAssertions = async (err: unknown) => {
			expect(err).toBe(undefined);
			expect(req.role?.isAdministrator).toBe(false);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addRoleContext(req, res, nextMock);
	});
});
