import { hasPermission } from '../hasPermission';
import {
	PermissionGrantEntityType,
	PermissionGrantVerb,
	stringToKeycloakId,
} from '../../../../types';
import type { AuthIdentityAndRole } from '../../../../types';

const authContext: AuthIdentityAndRole = {
	user: {
		keycloakUserId: stringToKeycloakId('11111111-1111-1111-1111-111111111111'),
	},
	role: { isAdministrator: false },
};

const mockDbReturning = (hasPermissionResult: boolean): { sql: jest.Mock } => ({
	sql: jest.fn().mockResolvedValue({
		rows: [{ hasPermission: hasPermissionResult }],
	}),
});

describe('hasPermission', () => {
	const cases: Array<{
		label: string;
		contextEntity: Parameters<typeof hasPermission>[2];
		expectedQuery: string;
		expectedEntityParam: Record<string, unknown>;
	}> = [
		{
			label: 'funder',
			contextEntity: {
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: 'exFunder',
			},
			expectedQuery: 'authorization.hasFunderPermission',
			expectedEntityParam: { funderShortCode: 'exFunder' },
		},
		{
			label: 'changemaker',
			contextEntity: {
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: 42,
			},
			expectedQuery: 'authorization.hasChangemakerPermission',
			expectedEntityParam: { changemakerId: 42 },
		},
		{
			label: 'dataProvider',
			contextEntity: {
				contextEntityType: PermissionGrantEntityType.DATA_PROVIDER,
				dataProviderShortCode: 'exDataProvider',
			},
			expectedQuery: 'authorization.hasDataProviderPermission',
			expectedEntityParam: { dataProviderShortCode: 'exDataProvider' },
		},
		{
			label: 'opportunity',
			contextEntity: {
				contextEntityType: PermissionGrantEntityType.OPPORTUNITY,
				opportunityId: 17,
			},
			expectedQuery: 'authorization.hasOpportunityPermission',
			expectedEntityParam: { opportunityId: 17 },
		},
		{
			label: 'proposal',
			contextEntity: {
				contextEntityType: PermissionGrantEntityType.PROPOSAL,
				proposalId: 23,
			},
			expectedQuery: 'authorization.hasProposalPermission',
			expectedEntityParam: { proposalId: 23 },
		},
		{
			label: 'proposalVersion',
			contextEntity: {
				contextEntityType: PermissionGrantEntityType.PROPOSAL_VERSION,
				proposalVersionId: 8,
			},
			expectedQuery: 'authorization.hasProposalVersionPermission',
			expectedEntityParam: { proposalVersionId: 8 },
		},
		{
			label: 'applicationForm',
			contextEntity: {
				contextEntityType: PermissionGrantEntityType.APPLICATION_FORM,
				applicationFormId: 3,
			},
			expectedQuery: 'authorization.hasApplicationFormPermission',
			expectedEntityParam: { applicationFormId: 3 },
		},
		{
			label: 'applicationFormField',
			contextEntity: {
				contextEntityType: PermissionGrantEntityType.APPLICATION_FORM_FIELD,
				applicationFormFieldId: 5,
			},
			expectedQuery: 'authorization.hasApplicationFormFieldPermission',
			expectedEntityParam: { applicationFormFieldId: 5 },
		},
		{
			label: 'proposalFieldValue',
			contextEntity: {
				contextEntityType: PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
				proposalFieldValueId: 11,
			},
			expectedQuery: 'authorization.hasProposalFieldValuePermission',
			expectedEntityParam: { proposalFieldValueId: 11 },
		},
		{
			label: 'source',
			contextEntity: {
				contextEntityType: PermissionGrantEntityType.SOURCE,
				sourceId: 99,
			},
			expectedQuery: 'authorization.hasSourcePermission',
			expectedEntityParam: { sourceId: 99 },
		},
		{
			label: 'bulkUpload',
			contextEntity: {
				contextEntityType: PermissionGrantEntityType.BULK_UPLOAD,
				bulkUploadTaskId: 7,
			},
			expectedQuery: 'authorization.hasBulkUploadPermission',
			expectedEntityParam: { bulkUploadTaskId: 7 },
		},
		{
			label: 'changemakerFieldValue',
			contextEntity: {
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE,
				changemakerFieldValueId: 13,
			},
			expectedQuery: 'authorization.hasChangemakerFieldValuePermission',
			expectedEntityParam: { changemakerFieldValueId: 13 },
		},
	];

	it.each(cases)(
		'$label: dispatches to $expectedQuery with the entity key, verb, and default scope',
		async ({ contextEntity, expectedQuery, expectedEntityParam }) => {
			const db = mockDbReturning(true);

			const result = await hasPermission(db, authContext, contextEntity, {
				permission: PermissionGrantVerb.MANAGE,
			});

			expect(result).toBe(true);
			expect(db.sql).toHaveBeenCalledTimes(1);
			expect(db.sql).toHaveBeenCalledWith(
				expectedQuery,
				expect.objectContaining({
					...expectedEntityParam,
					permission: PermissionGrantVerb.MANAGE,
					scope: contextEntity.contextEntityType,
				}),
			);
		},
	);

	it('uses the explicit scope when provided instead of defaulting to contextEntityType', async () => {
		const db = mockDbReturning(true);

		await hasPermission(
			db,
			authContext,
			{
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: 'exFunder',
			},
			{
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.OPPORTUNITY,
			},
		);

		expect(db.sql).toHaveBeenCalledWith(
			'authorization.hasFunderPermission',
			expect.objectContaining({
				funderShortCode: 'exFunder',
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.OPPORTUNITY,
			}),
		);
	});

	it('returns false when the underlying query reports no permission', async () => {
		const db = mockDbReturning(false);

		const result = await hasPermission(
			db,
			authContext,
			{
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: 1,
			},
			{ permission: PermissionGrantVerb.MANAGE },
		);

		expect(result).toBe(false);
	});
});
