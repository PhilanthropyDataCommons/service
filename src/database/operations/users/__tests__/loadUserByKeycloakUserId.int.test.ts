import { loadUserByKeycloakUserId } from '../loadUserByKeycloakUserId';
import {
	createOrUpdateUser,
	createOrUpdateFunder,
	createEphemeralUserGroupAssociation,
	loadSystemUser,
	createOpportunity,
	createOrUpdateUserOpportunityPermission,
	createOrUpdateUserGroupOpportunityPermission,
} from '../..';
import { db } from '../../../db';
import { OpportunityPermission, stringToKeycloakId } from '../../../../types';
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
		const keycloakOrganizationId = '9426f49a-4c11-4d26-9e58-2b62bf2ee512';
		const opportunity = await createOpportunity(db, null, {
			title: 'Test Opportunity',
			funderShortCode: funder.shortCode,
		});

		// Associate the user with an organization group
		await createEphemeralUserGroupAssociation(db, null, {
			userKeycloakUserId: user.keycloakUserId,
			userGroupKeycloakOrganizationId: stringToKeycloakId(
				keycloakOrganizationId,
			),
			notAfter: ephemeralExpiration,
		});

		// Assign EDIT and VIEW via direct user permissions
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

		// Assign MANAGE and CREATE_PROPOSAL via group permissions
		await createOrUpdateUserGroupOpportunityPermission(
			db,
			systemUserAuthContext,
			{
				keycloakOrganizationId: stringToKeycloakId(keycloakOrganizationId),
				opportunityId: opportunity.id,
				opportunityPermission: OpportunityPermission.MANAGE,
			},
		);
		await createOrUpdateUserGroupOpportunityPermission(
			db,
			systemUserAuthContext,
			{
				keycloakOrganizationId: stringToKeycloakId(keycloakOrganizationId),
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

		// Associate the user with an organization group (expired)
		const keycloakOrganizationId = '9426f49a-4c11-4d26-9e58-2b62bf2ee512';
		const funder = await createOrUpdateFunder(db, null, {
			keycloakOrganizationId: null,
			name: 'Foo Funder',
			shortCode: 'fooFunder',
			isCollaborative: false,
		});
		const opportunity = await createOpportunity(db, null, {
			title: 'Test Opportunity',
			funderShortCode: funder.shortCode,
		});
		await createEphemeralUserGroupAssociation(db, null, {
			userKeycloakUserId: user.keycloakUserId,
			userGroupKeycloakOrganizationId: stringToKeycloakId(
				keycloakOrganizationId,
			),
			notAfter: new Date(0).toISOString(),
		});

		// Assign VIEW via group permissions
		await createOrUpdateUserGroupOpportunityPermission(
			db,
			systemUserAuthContext,
			{
				keycloakOrganizationId: stringToKeycloakId(keycloakOrganizationId),
				opportunityId: opportunity.id,
				opportunityPermission: OpportunityPermission.VIEW,
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
				opportunity: {},
			},
		});
	});
});
