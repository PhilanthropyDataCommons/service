import { loadUserByKeycloakUserId } from '../loadUserByKeycloakUserId';
import {
	createOrUpdateUser,
	createOrUpdateFunder,
	createEphemeralUserGroupAssociation,
	loadSystemUser,
	createOrUpdateDataProvider,
	createOrUpdateUserDataProviderPermission,
	createOrUpdateUserGroupDataProviderPermission,
	createOpportunity,
	createOrUpdateUserOpportunityPermission,
	createOrUpdateUserGroupOpportunityPermission,
} from '../..';
import { db } from '../../../db';
import {
	OpportunityPermission,
	Permission,
	stringToKeycloakId,
} from '../../../../types';
import { getAuthContext } from '../../../../test/utils';
import {
	expectArrayContaining,
	expectTimestamp,
} from '../../../../test/asymettricMatchers';

describe('loadUserByKeycloakUserId', () => {
	it('should populate roles correctly based on direct permissions as well as user groups permissions', async () => {
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser, true);
		const ephemeralExpiration = new Date(Date.now() + 3600000).toISOString();
		const user = await createOrUpdateUser(db, null, {
			keycloakUserId: '42db47e1-0612-4a41-9092-7928491b1fad',
			keycloakUserName: 'Bob',
		});
		const funder = await createOrUpdateFunder(db, null, {
			keycloakOrganizationId: null,
			name: 'Foo Funder',
			shortCode: 'fooFunder',
			isCollaborative: false,
		});
		const dataProviderKeycloakOrganizationId =
			'9426f49a-4c11-4d26-9e58-2b62bf2ee512';
		const dataProvider = await createOrUpdateDataProvider(db, null, {
			keycloakOrganizationId: dataProviderKeycloakOrganizationId,
			name: 'Foo Data Provider',
			shortCode: 'fooDataProvider',
		});
		const opportunity = await createOpportunity(db, null, {
			title: 'Test Opportunity',
			funderShortCode: funder.shortCode,
		});

		// Associate the user with a data provider group
		await createEphemeralUserGroupAssociation(db, null, {
			userKeycloakUserId: user.keycloakUserId,
			userGroupKeycloakOrganizationId: stringToKeycloakId(
				dataProviderKeycloakOrganizationId,
			),
			notAfter: ephemeralExpiration,
		});

		// Assign EDIT and VIEW via direct user permissions
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
		await createOrUpdateUserOpportunityPermission(db, systemUserAuthContext, {
			userKeycloakUserId: user.keycloakUserId,
			opportunityId: opportunity.id,
			opportunityPermission: OpportunityPermission.EDIT,
		});
		await createOrUpdateUserOpportunityPermission(db, systemUserAuthContext, {
			userKeycloakUserId: user.keycloakUserId,
			opportunityId: opportunity.id,
			opportunityPermission: OpportunityPermission.VIEW,
		});

		// Assign MANAGE and VIEW via group permissions
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
		await createOrUpdateUserGroupOpportunityPermission(
			db,
			systemUserAuthContext,
			{
				keycloakOrganizationId: stringToKeycloakId(
					dataProviderKeycloakOrganizationId,
				),
				opportunityId: opportunity.id,
				opportunityPermission: OpportunityPermission.MANAGE,
			},
		);
		await createOrUpdateUserGroupOpportunityPermission(
			db,
			systemUserAuthContext,
			{
				keycloakOrganizationId: stringToKeycloakId(
					dataProviderKeycloakOrganizationId,
				),
				opportunityId: opportunity.id,
				opportunityPermission: OpportunityPermission.CREATE_PROPOSAL,
			},
		);

		const populatedUser = await loadUserByKeycloakUserId(
			db,
			systemUserAuthContext,
			user.keycloakUserId,
		);

		expect(populatedUser).toEqual({
			...user,
			createdAt: expectTimestamp(),
			permissions: {
				dataProvider: {
					fooDataProvider: expectArrayContaining([
						Permission.MANAGE,
						Permission.EDIT,
						Permission.VIEW,
					]),
				},
				opportunity: {
					[opportunity.id]: expectArrayContaining([
						OpportunityPermission.MANAGE,
						OpportunityPermission.EDIT,
						OpportunityPermission.VIEW,
						OpportunityPermission.CREATE_PROPOSAL,
					]),
				},
			},
		});
	});

	it('should not populate roles for expired group associations', async () => {
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser, true);
		const user = await createOrUpdateUser(db, null, {
			keycloakUserId: '42db47e1-0612-4a41-9092-7928491b1fad',
			keycloakUserName: 'Carol',
		});

		// Associate the user with a data provider group (expired)
		const dataProviderKeycloakOrganizationId =
			'9426f49a-4c11-4d26-9e58-2b62bf2ee512';
		const dataProvider = await createOrUpdateDataProvider(db, null, {
			keycloakOrganizationId: dataProviderKeycloakOrganizationId,
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
			systemUserAuthContext,
			user.keycloakUserId,
		);

		expect(populatedUser).toEqual({
			...user,
			createdAt: expectTimestamp(),
			permissions: {
				dataProvider: {},
				opportunity: {},
			},
		});
	});

	it('should not populate roles when loaded without authorization', async () => {
		const user = await createOrUpdateUser(db, null, {
			keycloakUserId: '42db47e1-0612-4a41-9092-7928491b1fad',
			keycloakUserName: 'Carol',
		});

		const populatedUser = await loadUserByKeycloakUserId(
			db,
			null,
			user.keycloakUserId,
		);

		expect(populatedUser).toEqual({
			...user,
			createdAt: expectTimestamp(),
			permissions: {
				dataProvider: {},
				opportunity: {},
			},
		});
	});
});
