import { canManagePermissionGrantByContext } from '../canManagePermissionGrantByContext';
import {
	PermissionGrantEntityType,
	stringToKeycloakId,
} from '../../../../types';
import type { AuthIdentityAndRole } from '../../../../types';

const authContext: AuthIdentityAndRole = {
	user: {
		keycloakUserId: stringToKeycloakId('11111111-1111-1111-1111-111111111111'),
	},
	role: { isAdministrator: false },
};

const adminAuthContext: AuthIdentityAndRole = {
	user: {
		keycloakUserId: stringToKeycloakId('22222222-2222-2222-2222-222222222222'),
	},
	role: { isAdministrator: true },
};

const mockDbReturning = (result: boolean): { sql: jest.Mock } => ({
	sql: jest.fn().mockResolvedValue({
		rows: [{ result }],
	}),
});

describe('canManagePermissionGrantByContext', () => {
	const cases: Array<{
		label: string;
		grant: Parameters<typeof canManagePermissionGrantByContext>[2];
		expectedKey: Record<string, unknown>;
	}> = [
		{
			label: 'funder',
			grant: {
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: 'exFunder',
			},
			expectedKey: { funderShortCode: 'exFunder' },
		},
		{
			label: 'changemaker',
			grant: {
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: 42,
			},
			expectedKey: { changemakerId: 42 },
		},
		{
			label: 'dataProvider',
			grant: {
				contextEntityType: PermissionGrantEntityType.DATA_PROVIDER,
				dataProviderShortCode: 'exDataProvider',
			},
			expectedKey: { dataProviderShortCode: 'exDataProvider' },
		},
		{
			label: 'opportunity',
			grant: {
				contextEntityType: PermissionGrantEntityType.OPPORTUNITY,
				opportunityId: 17,
			},
			expectedKey: { opportunityId: 17 },
		},
		{
			label: 'proposal',
			grant: {
				contextEntityType: PermissionGrantEntityType.PROPOSAL,
				proposalId: 23,
			},
			expectedKey: { proposalId: 23 },
		},
		{
			label: 'applicationForm',
			grant: {
				contextEntityType: PermissionGrantEntityType.APPLICATION_FORM,
				applicationFormId: 3,
			},
			expectedKey: { applicationFormId: 3 },
		},
		{
			label: 'proposalFieldValue',
			grant: {
				contextEntityType: PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
				proposalFieldValueId: 11,
			},
			expectedKey: { proposalFieldValueId: 11 },
		},
		{
			label: 'source',
			grant: {
				contextEntityType: PermissionGrantEntityType.SOURCE,
				sourceId: 99,
			},
			expectedKey: { sourceId: 99 },
		},
		{
			label: 'changemakerFieldValue',
			grant: {
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE,
				changemakerFieldValueId: 13,
			},
			expectedKey: { changemakerFieldValueId: 13 },
		},
		{
			label: 'terminologySet',
			grant: {
				contextEntityType: PermissionGrantEntityType.TERMINOLOGY_SET,
				terminologySetId: 31,
			},
			expectedKey: { terminologySetId: 31 },
		},
		{
			label: 'applicationFormField',
			grant: {
				contextEntityType: PermissionGrantEntityType.APPLICATION_FORM_FIELD,
				applicationFormFieldId: 5,
			},
			expectedKey: { applicationFormFieldId: 5 },
		},
		{
			label: 'proposalVersion',
			grant: {
				contextEntityType: PermissionGrantEntityType.PROPOSAL_VERSION,
				proposalVersionId: 8,
			},
			expectedKey: { proposalVersionId: 8 },
		},
		{
			label: 'bulkUpload',
			grant: {
				contextEntityType: PermissionGrantEntityType.BULK_UPLOAD,
				bulkUploadTaskId: 7,
			},
			expectedKey: { bulkUploadTaskId: 7 },
		},
	];

	const ALL_UNSET_ID_KEYS = {
		funderShortCode: undefined,
		changemakerId: undefined,
		dataProviderShortCode: undefined,
		opportunityId: undefined,
		proposalId: undefined,
		proposalVersionId: undefined,
		applicationFormId: undefined,
		applicationFormFieldId: undefined,
		proposalFieldValueId: undefined,
		sourceId: undefined,
		bulkUploadTaskId: undefined,
		changemakerFieldValueId: undefined,
		terminologySetId: undefined,
	};

	it.each(cases)(
		'$label: invokes the SQL wrapper with the grant context type and only the matching id field populated',
		async ({ grant, expectedKey }) => {
			const db = mockDbReturning(true);

			const result = await canManagePermissionGrantByContext(
				db,
				authContext,
				grant,
			);

			expect(result).toBe(true);
			expect(db.sql).toHaveBeenCalledTimes(1);
			expect(db.sql).toHaveBeenCalledWith(
				'authorization.canManagePermissionGrantByContext',
				expect.objectContaining({
					authContextKeycloakUserId: authContext.user.keycloakUserId,
					authContextIsAdministrator: false,
					contextEntityType: grant.contextEntityType,
					...ALL_UNSET_ID_KEYS,
					...expectedKey,
				}),
			);
		},
	);

	it('forwards admin role to the SQL wrapper', async () => {
		const db = mockDbReturning(true);

		await canManagePermissionGrantByContext(db, adminAuthContext, {
			contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
			changemakerId: 1,
		});

		expect(db.sql).toHaveBeenCalledWith(
			'authorization.canManagePermissionGrantByContext',
			expect.objectContaining({
				authContextIsAdministrator: true,
			}),
		);
	});

	it('returns false when the underlying query reports no permission', async () => {
		const db = mockDbReturning(false);

		const result = await canManagePermissionGrantByContext(db, authContext, {
			contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
			changemakerId: 1,
		});

		expect(result).toBe(false);
	});

	it('returns false when the query returns no rows', async () => {
		const db = { sql: jest.fn().mockResolvedValue({ rows: [] }) };

		const result = await canManagePermissionGrantByContext(db, authContext, {
			contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
			changemakerId: 1,
		});

		expect(result).toBe(false);
	});
});
