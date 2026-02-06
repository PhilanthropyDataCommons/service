import { requireChangemakerPermission } from '../requireChangemakerPermission';
import { InputValidationError, UnauthorizedError } from '../../errors';
import {
	db,
	createChangemaker,
	createPermissionGrant,
	loadSystemUser,
} from '../../database';
import { getAuthContext, getMockedUser, loadTestUser } from '../../test/utils';
import { getMockRequest, getMockResponse } from '../../test/mockExpress';
import {
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
} from '../../types';
import type { AuthenticatedRequest } from '../../types';

describe('requireChangemakerPermission', () => {
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

		void requireChangemakerPermission(PermissionGrantVerb.VIEW)(
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
		req.params = { changemakerId: '999' };
		const nextMock = jest.fn((error: unknown) => {
			expect(error).toBe(undefined);
			done();
		});

		void requireChangemakerPermission(PermissionGrantVerb.VIEW)(
			req,
			res,
			nextMock,
		);
	});

	it('calls next with an InputValidationError when changemakerId is invalid', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.user = getMockedUser();
		req.role = { isAdministrator: false };
		req.params = { changemakerId: 'not-a-number' };
		const nextMock = jest.fn((error: unknown) => {
			expect(error).toBeInstanceOf(InputValidationError);
			expect(error).toMatchObject({
				message: 'Invalid changemakerId.',
			});
			done();
		});

		void requireChangemakerPermission(PermissionGrantVerb.VIEW)(
			req,
			res,
			nextMock,
		);
	});

	it('calls next with an UnauthorizedError when user lacks permission', (done) => {
		void (async () => {
			const testUser = await loadTestUser();
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Test Changemaker',
				keycloakOrganizationId: null,
			});

			const req = getMockRequest() as AuthenticatedRequest;
			const res = getMockResponse();
			req.user = testUser;
			req.role = { isAdministrator: false };
			req.params = { changemakerId: String(changemaker.id) };
			const nextMock = jest.fn((error: unknown) => {
				expect(error).toBeInstanceOf(UnauthorizedError);
				expect(error).toMatchObject({
					message:
						'Authenticated user does not have permission to perform this action.',
				});
				done();
			});

			void requireChangemakerPermission(PermissionGrantVerb.EDIT)(
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
			const changemaker = await createChangemaker(db, null, {
				taxId: '22-2222222',
				name: 'Permitted Changemaker',
				keycloakOrganizationId: null,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.EDIT],
			});

			const req = getMockRequest() as AuthenticatedRequest;
			const res = getMockResponse();
			req.user = testUser;
			req.role = { isAdministrator: false };
			req.params = { changemakerId: String(changemaker.id) };
			const nextMock = jest.fn((error: unknown) => {
				expect(error).toBe(undefined);
				done();
			});

			void requireChangemakerPermission(PermissionGrantVerb.EDIT)(
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
			const changemaker = await createChangemaker(db, null, {
				taxId: '33-3333333',
				name: 'View Only Changemaker',
				keycloakOrganizationId: null,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const req = getMockRequest() as AuthenticatedRequest;
			const res = getMockResponse();
			req.user = testUser;
			req.role = { isAdministrator: false };
			req.params = { changemakerId: String(changemaker.id) };
			const nextMock = jest.fn((error: unknown) => {
				expect(error).toBeInstanceOf(UnauthorizedError);
				expect(error).toMatchObject({
					message:
						'Authenticated user does not have permission to perform this action.',
				});
				done();
			});

			void requireChangemakerPermission(PermissionGrantVerb.EDIT)(
				req,
				res,
				nextMock,
			);
		})();
	});
});
