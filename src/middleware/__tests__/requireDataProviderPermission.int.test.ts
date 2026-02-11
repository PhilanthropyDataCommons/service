import { requireDataProviderPermission } from '../requireDataProviderPermission';
import { InputValidationError, UnauthorizedError } from '../../errors';
import { db, createPermissionGrant, loadSystemUser } from '../../database';
import { createTestDataProvider } from '../../test/factories';
import { getAuthContext, getMockedUser, loadTestUser } from '../../test/utils';
import { getMockRequest, getMockResponse } from '../../test/mockExpress';
import {
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
} from '../../types';
import type { AuthenticatedRequest } from '../../types';

describe('requireDataProviderPermission', () => {
	it('calls next with an UnauthorizedError when request lacks AuthContext', (done) => {
		const req = getMockRequest();
		const res = getMockResponse();
		const nextMock = jest.fn((error: unknown) => {
			expect(error).toBeInstanceOf(UnauthorizedError);
			expect(error).toMatchObject({
				message: 'The request lacks an AuthContext.',
			});
			done();
		});

		void requireDataProviderPermission(PermissionGrantVerb.VIEW)(
			req,
			res,
			nextMock,
		);
	});

	it('calls next without error when user is an administrator', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.user = getMockedUser();
		req.role = { isAdministrator: true };
		req.params = { dataProviderShortCode: 'test_dp' };
		const nextMock = jest.fn((error: unknown) => {
			expect(error).toBe(undefined);
			done();
		});

		void requireDataProviderPermission(PermissionGrantVerb.VIEW)(
			req,
			res,
			nextMock,
		);
	});

	it('calls next with an InputValidationError when dataProviderShortCode is invalid', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.user = getMockedUser();
		req.role = { isAdministrator: false };
		req.params = { dataProviderShortCode: 'INVALID SHORTCODE WITH SPACES!' };
		const nextMock = jest.fn((error: unknown) => {
			expect(error).toBeInstanceOf(InputValidationError);
			expect(error).toMatchObject({
				message: 'Invalid dataProviderShortCode.',
			});
			done();
		});

		void requireDataProviderPermission(PermissionGrantVerb.VIEW)(
			req,
			res,
			nextMock,
		);
	});

	it('calls next with an UnauthorizedError when user lacks permission', (done) => {
		void (async () => {
			const testUser = await loadTestUser();
			const dataProvider = await createTestDataProvider(db, null);

			const req = getMockRequest() as AuthenticatedRequest;
			const res = getMockResponse();
			req.user = testUser;
			req.role = { isAdministrator: false };
			req.params = { dataProviderShortCode: dataProvider.shortCode };
			const nextMock = jest.fn((error: unknown) => {
				expect(error).toBeInstanceOf(UnauthorizedError);
				expect(error).toMatchObject({
					message:
						'Authenticated user does not have permission to perform this action.',
				});
				done();
			});

			void requireDataProviderPermission(PermissionGrantVerb.EDIT)(
				req,
				res,
				nextMock,
			);
		})();
	});

	it('calls next without error when user has the required permission', (done) => {
		void (async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			const testUser = await loadTestUser();
			const dataProvider = await createTestDataProvider(db, null);

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.DATA_PROVIDER,
				dataProviderShortCode: dataProvider.shortCode,
				scope: [PermissionGrantEntityType.DATA_PROVIDER],
				verbs: [PermissionGrantVerb.EDIT],
			});

			const req = getMockRequest() as AuthenticatedRequest;
			const res = getMockResponse();
			req.user = testUser;
			req.role = { isAdministrator: false };
			req.params = { dataProviderShortCode: dataProvider.shortCode };
			const nextMock = jest.fn((error: unknown) => {
				expect(error).toBe(undefined);
				done();
			});

			void requireDataProviderPermission(PermissionGrantVerb.EDIT)(
				req,
				res,
				nextMock,
			);
		})();
	});

	it('calls next with an UnauthorizedError when user has a different permission than required', (done) => {
		void (async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			const testUser = await loadTestUser();
			const dataProvider = await createTestDataProvider(db, null);

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.DATA_PROVIDER,
				dataProviderShortCode: dataProvider.shortCode,
				scope: [PermissionGrantEntityType.DATA_PROVIDER],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const req = getMockRequest() as AuthenticatedRequest;
			const res = getMockResponse();
			req.user = testUser;
			req.role = { isAdministrator: false };
			req.params = { dataProviderShortCode: dataProvider.shortCode };
			const nextMock = jest.fn((error: unknown) => {
				expect(error).toBeInstanceOf(UnauthorizedError);
				expect(error).toMatchObject({
					message:
						'Authenticated user does not have permission to perform this action.',
				});
				done();
			});

			void requireDataProviderPermission(PermissionGrantVerb.EDIT)(
				req,
				res,
				nextMock,
			);
		})();
	});
});
