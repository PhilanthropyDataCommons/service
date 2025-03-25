import { loadUserByKeycloakUserId } from '../loadUserByKeycloakUserId';
import {
	createOrUpdateUser,
	createChangemaker,
	createOrUpdateFunder,
	createOrUpdateUserChangemakerPermission,
	createOrUpdateUserGroupChangemakerPermission,
	createEphemeralUserGroupAssociation,
	loadSystemUser,
	createOrUpdateDataProvider,
	createOrUpdateUserFunderPermission,
	createOrUpdateUserGroupFunderPermission,
	createOrUpdateUserDataProviderPermission,
	createOrUpdateUserGroupDataProviderPermission,
} from '../..';
import { db } from '../../../db';
import { Permission, stringToKeycloakId } from '../../../../types';
import { expectTimestamp, getAuthContext } from '../../../../test/utils';

describe('loadUserByKeycloakUserId', () => {
	it('should populate roles correctly based on direct permissions as well as user groups permissions', async () => {
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const ephemeralExpiration = new Date(Date.now() + 3600000).toISOString();
		const user = await createOrUpdateUser(db, null, {
			keycloakUserId: '42db47e1-0612-4a41-9092-7928491b1fad',
		});

		// Associate the user with a changemaker group
		const changemakerKeycloakOrganizationId =
			'b10aaea1-4558-422b-85bf-073bfc9cd05f';
		const changemaker = await createChangemaker(db, null, {
			keycloakOrganizationId: changemakerKeycloakOrganizationId,
			name: 'Foo Changemaker',
			taxId: '12-3456789',
		});
		await createEphemeralUserGroupAssociation(db, null, {
			userKeycloakUserId: user.keycloakUserId,
			userGroupKeycloakOrganizationId: stringToKeycloakId(
				changemakerKeycloakOrganizationId,
			),
			notAfter: ephemeralExpiration,
		});

		// Associate the user with a funder group
		const funderKeycloakOrganizationId = 'f4941cc3-6b39-4b4f-bc60-cac4541d2788';
		const funder = await createOrUpdateFunder(db, null, {
			keycloakOrganizationId: funderKeycloakOrganizationId,
			name: 'Foo Funder',
			shortCode: 'fooFunder',
		});
		await createEphemeralUserGroupAssociation(db, null, {
			userKeycloakUserId: user.keycloakUserId,
			userGroupKeycloakOrganizationId: stringToKeycloakId(
				funderKeycloakOrganizationId,
			),
			notAfter: ephemeralExpiration,
		});

		// Associate the user with a data provider group
		const dataProviderKeycloakOrganizationId =
			'9426f49a-4c11-4d26-9e58-2b62bf2ee512';
		const dataProvider = await createOrUpdateDataProvider(db, null, {
			keycloakOrganizationId: funderKeycloakOrganizationId,
			name: 'Foo Data Provider',
			shortCode: 'fooDataProvider',
		});
		await createEphemeralUserGroupAssociation(db, null, {
			userKeycloakUserId: user.keycloakUserId,
			userGroupKeycloakOrganizationId: stringToKeycloakId(
				dataProviderKeycloakOrganizationId,
			),
			notAfter: ephemeralExpiration,
		});

		// Assign EDIT and VIEW via direct permissions
		await createOrUpdateUserChangemakerPermission(db, systemUserAuthContext, {
			userKeycloakUserId: user.keycloakUserId,
			changemakerId: changemaker.id,
			permission: Permission.EDIT,
		});
		await createOrUpdateUserChangemakerPermission(db, systemUserAuthContext, {
			userKeycloakUserId: user.keycloakUserId,
			changemakerId: changemaker.id,
			permission: Permission.VIEW,
		});
		await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
			userKeycloakUserId: user.keycloakUserId,
			funderShortCode: funder.shortCode,
			permission: Permission.EDIT,
		});
		await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
			userKeycloakUserId: user.keycloakUserId,
			funderShortCode: funder.shortCode,
			permission: Permission.VIEW,
		});
		await createOrUpdateUserDataProviderPermission(db, systemUserAuthContext, {
			userKeycloakUserId: user.keycloakUserId,
			dataProviderShortCode: dataProvider.shortCode,
			permission: Permission.EDIT,
		});
		await createOrUpdateUserDataProviderPermission(db, systemUserAuthContext, {
			userKeycloakUserId: user.keycloakUserId,
			dataProviderShortCode: dataProvider.shortCode,
			permission: Permission.VIEW,
		});

		// Assign MANAGE and VIEW via group permissions
		await createOrUpdateUserGroupChangemakerPermission(
			db,
			systemUserAuthContext,
			{
				keycloakOrganizationId: stringToKeycloakId(
					changemakerKeycloakOrganizationId,
				),
				changemakerId: changemaker.id,
				permission: Permission.MANAGE,
			},
		);
		await createOrUpdateUserGroupChangemakerPermission(
			db,
			systemUserAuthContext,
			{
				keycloakOrganizationId: stringToKeycloakId(
					changemakerKeycloakOrganizationId,
				),
				changemakerId: changemaker.id,
				permission: Permission.VIEW,
			},
		);
		await createOrUpdateUserGroupFunderPermission(db, systemUserAuthContext, {
			keycloakOrganizationId: stringToKeycloakId(funderKeycloakOrganizationId),
			funderShortCode: funder.shortCode,
			permission: Permission.MANAGE,
		});
		await createOrUpdateUserGroupFunderPermission(db, systemUserAuthContext, {
			keycloakOrganizationId: stringToKeycloakId(funderKeycloakOrganizationId),
			funderShortCode: funder.shortCode,
			permission: Permission.VIEW,
		});
		await createOrUpdateUserGroupDataProviderPermission(
			db,
			systemUserAuthContext,
			{
				keycloakOrganizationId: stringToKeycloakId(
					dataProviderKeycloakOrganizationId,
				),
				dataProviderShortCode: dataProvider.shortCode,
				permission: Permission.MANAGE,
			},
		);
		await createOrUpdateUserGroupDataProviderPermission(
			db,
			systemUserAuthContext,
			{
				keycloakOrganizationId: stringToKeycloakId(
					dataProviderKeycloakOrganizationId,
				),
				dataProviderShortCode: dataProvider.shortCode,
				permission: Permission.VIEW,
			},
		);

		const populatedUser = await loadUserByKeycloakUserId(
			db,
			null,
			user.keycloakUserId,
		);

		expect(populatedUser).toEqual({
			createdAt: expectTimestamp,
			keycloakUserId: user.keycloakUserId,
			permissions: {
				changemaker: {
					1: expect.arrayContaining([
						Permission.MANAGE,
						Permission.EDIT,
						Permission.VIEW,
					]) as Permission[],
				},
				dataProvider: {
					fooDataProvider: expect.arrayContaining([
						Permission.MANAGE,
						Permission.EDIT,
						Permission.VIEW,
					]) as Permission[],
				},
				funder: {
					fooFunder: expect.arrayContaining([
						Permission.MANAGE,
						Permission.EDIT,
						Permission.VIEW,
					]) as Permission[],
				},
			},
		});
	});

	it('should not populate roles for expired group associations', async () => {
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const user = await createOrUpdateUser(db, null, {
			keycloakUserId: '42db47e1-0612-4a41-9092-7928491b1fad',
		});

		// Associate the user with a changemaker group
		const changemakerKeycloakOrganizationId =
			'b10aaea1-4558-422b-85bf-073bfc9cd05f';
		const changemaker = await createChangemaker(db, null, {
			keycloakOrganizationId: changemakerKeycloakOrganizationId,
			name: 'Foo Changemaker',
			taxId: '12-3456789',
		});
		await createEphemeralUserGroupAssociation(db, null, {
			userKeycloakUserId: user.keycloakUserId,
			userGroupKeycloakOrganizationId: stringToKeycloakId(
				changemakerKeycloakOrganizationId,
			),
			notAfter: new Date(0).toISOString(),
		});

		// Associate the user with a funder group
		const funderKeycloakOrganizationId = 'f4941cc3-6b39-4b4f-bc60-cac4541d2788';
		const funder = await createOrUpdateFunder(db, null, {
			keycloakOrganizationId: funderKeycloakOrganizationId,
			name: 'Foo Funder',
			shortCode: 'fooFunder',
		});
		await createEphemeralUserGroupAssociation(db, null, {
			userKeycloakUserId: user.keycloakUserId,
			userGroupKeycloakOrganizationId: stringToKeycloakId(
				funderKeycloakOrganizationId,
			),
			notAfter: new Date(0).toISOString(),
		});

		// Associate the user with a data provider group
		const dataProviderKeycloakOrganizationId =
			'9426f49a-4c11-4d26-9e58-2b62bf2ee512';
		const dataProvider = await createOrUpdateDataProvider(db, null, {
			keycloakOrganizationId: funderKeycloakOrganizationId,
			name: 'Foo Data Provider',
			shortCode: 'fooDataProvider',
		});
		await createEphemeralUserGroupAssociation(db, null, {
			userKeycloakUserId: user.keycloakUserId,
			userGroupKeycloakOrganizationId: stringToKeycloakId(
				dataProviderKeycloakOrganizationId,
			),
			notAfter: new Date(0).toISOString(),
		});

		// Assign VIEW via group permissions
		await createOrUpdateUserGroupChangemakerPermission(
			db,
			systemUserAuthContext,
			{
				keycloakOrganizationId: stringToKeycloakId(
					changemakerKeycloakOrganizationId,
				),
				changemakerId: changemaker.id,
				permission: Permission.VIEW,
			},
		);
		await createOrUpdateUserGroupFunderPermission(db, systemUserAuthContext, {
			keycloakOrganizationId: stringToKeycloakId(funderKeycloakOrganizationId),
			funderShortCode: funder.shortCode,
			permission: Permission.VIEW,
		});
		await createOrUpdateUserGroupDataProviderPermission(
			db,
			systemUserAuthContext,
			{
				keycloakOrganizationId: stringToKeycloakId(
					dataProviderKeycloakOrganizationId,
				),
				dataProviderShortCode: dataProvider.shortCode,
				permission: Permission.VIEW,
			},
		);

		const populatedUser = await loadUserByKeycloakUserId(
			db,
			null,
			user.keycloakUserId,
		);

		expect(populatedUser).toEqual({
			createdAt: expectTimestamp,
			keycloakUserId: user.keycloakUserId,
			permissions: {
				changemaker: {},
				dataProvider: {},
				funder: {},
			},
		});
	});
});
