import { PermissionGrantEntityType } from '../../../types';
import { hasApplicationFormFieldPermission } from './hasApplicationFormFieldPermission';
import { hasApplicationFormPermission } from './hasApplicationFormPermission';
import { hasBulkUploadPermission } from './hasBulkUploadPermission';
import { hasChangemakerFieldValuePermission } from './hasChangemakerFieldValuePermission';
import { hasChangemakerPermission } from './hasChangemakerPermission';
import { hasDataProviderPermission } from './hasDataProviderPermission';
import { hasFunderPermission } from './hasFunderPermission';
import { hasOpportunityPermission } from './hasOpportunityPermission';
import { hasProposalFieldValuePermission } from './hasProposalFieldValuePermission';
import { hasProposalPermission } from './hasProposalPermission';
import { hasProposalVersionPermission } from './hasProposalVersionPermission';
import { hasSourcePermission } from './hasSourcePermission';
import type {
	AuthIdentityAndRole,
	PermissionGrantContextEntity,
	PermissionGrantVerb,
} from '../../../types';
import type { TinyPg } from 'tinypg';

const hasPermission = async (
	db: Pick<TinyPg, 'sql'>,
	authContext: AuthIdentityAndRole | null,
	contextEntity: PermissionGrantContextEntity,
	options: {
		permission: PermissionGrantVerb;
		scope?: PermissionGrantEntityType;
	},
): Promise<boolean> => {
	const { permission, scope = contextEntity.contextEntityType } = options;
	switch (contextEntity.contextEntityType) {
		case PermissionGrantEntityType.FUNDER:
			return await hasFunderPermission(db, authContext, {
				funderShortCode: contextEntity.funderShortCode,
				permission,
				scope,
			});
		case PermissionGrantEntityType.CHANGEMAKER:
			return await hasChangemakerPermission(db, authContext, {
				changemakerId: contextEntity.changemakerId,
				permission,
				scope,
			});
		case PermissionGrantEntityType.DATA_PROVIDER:
			return await hasDataProviderPermission(db, authContext, {
				dataProviderShortCode: contextEntity.dataProviderShortCode,
				permission,
				scope,
			});
		case PermissionGrantEntityType.OPPORTUNITY:
			return await hasOpportunityPermission(db, authContext, {
				opportunityId: contextEntity.opportunityId,
				permission,
				scope,
			});
		case PermissionGrantEntityType.PROPOSAL:
			return await hasProposalPermission(db, authContext, {
				proposalId: contextEntity.proposalId,
				permission,
				scope,
			});
		case PermissionGrantEntityType.PROPOSAL_VERSION:
			return await hasProposalVersionPermission(db, authContext, {
				proposalVersionId: contextEntity.proposalVersionId,
				permission,
				scope,
			});
		case PermissionGrantEntityType.APPLICATION_FORM:
			return await hasApplicationFormPermission(db, authContext, {
				applicationFormId: contextEntity.applicationFormId,
				permission,
				scope,
			});
		case PermissionGrantEntityType.APPLICATION_FORM_FIELD:
			return await hasApplicationFormFieldPermission(db, authContext, {
				applicationFormFieldId: contextEntity.applicationFormFieldId,
				permission,
				scope,
			});
		case PermissionGrantEntityType.PROPOSAL_FIELD_VALUE:
			return await hasProposalFieldValuePermission(db, authContext, {
				proposalFieldValueId: contextEntity.proposalFieldValueId,
				permission,
				scope,
			});
		case PermissionGrantEntityType.SOURCE:
			return await hasSourcePermission(db, authContext, {
				sourceId: contextEntity.sourceId,
				permission,
				scope,
			});
		case PermissionGrantEntityType.BULK_UPLOAD:
			return await hasBulkUploadPermission(db, authContext, {
				bulkUploadTaskId: contextEntity.bulkUploadTaskId,
				permission,
				scope,
			});
		case PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE:
			return await hasChangemakerFieldValuePermission(db, authContext, {
				changemakerFieldValueId: contextEntity.changemakerFieldValueId,
				permission,
				scope,
			});
	}
};

export { hasPermission };
