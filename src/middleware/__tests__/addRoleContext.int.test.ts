import { addRoleContext } from '../addRoleContext';
import { generateNextWithAssertions } from '../../test/utils';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../types';

describe('addRoleContext', () => {
	it('Assigns the administrator role if pdc-admin is in the auth roles', (done) => {
		const mockRequest = {
			auth: {
				realm_access: {
					roles: ['pdc-admin'],
				},
			},
		} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

		const runAssertions = async (err: unknown) => {
			expect(err).toBe(undefined);
			expect(mockRequest.role?.isAdministrator).toBe(true);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addRoleContext(mockRequest, mockResponse, nextMock);
	});

	it('Does NOT assign the administrator role if pdc-admin is not the auth roles', (done) => {
		const mockRequest = {
			auth: {
				realm_access: {
					roles: ['not-pdc-admin'],
				},
			},
		} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

		const runAssertions = async (err: unknown) => {
			expect(err).toBe(undefined);
			expect(mockRequest.role?.isAdministrator).toBe(false);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addRoleContext(mockRequest, mockResponse, nextMock);
	});
});
