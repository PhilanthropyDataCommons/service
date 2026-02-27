SELECT drop_function('permission_grant_to_json');

CREATE FUNCTION permission_grant_to_json(permission_grant permission_grants)
RETURNS jsonb AS $$
BEGIN
	RETURN jsonb_build_object(
		'id', permission_grant.id,
		'granteeType', permission_grant.grantee_type,
		'granteeUserKeycloakUserId', permission_grant.grantee_user_keycloak_user_id,
		'granteeKeycloakOrganizationId',
		permission_grant.grantee_keycloak_organization_id,
		'contextEntityType', permission_grant.context_entity_type,
		'scope', permission_grant.scope,
		'verbs', permission_grant.verbs,
		'createdBy', permission_grant.created_by,
		'conditions', permission_grant.conditions,
		'createdAt', permission_grant.created_at
	) || CASE permission_grant.context_entity_type
		WHEN 'changemaker'
			THEN jsonb_build_object('changemakerId', permission_grant.changemaker_id)
		WHEN 'funder'
			THEN jsonb_build_object(
				'funderShortCode', permission_grant.funder_short_code
			)
		WHEN 'dataProvider'
			THEN jsonb_build_object(
				'dataProviderShortCode', permission_grant.data_provider_short_code
			)
		WHEN 'opportunity'
			THEN jsonb_build_object('opportunityId', permission_grant.opportunity_id)
		WHEN 'proposal'
			THEN jsonb_build_object('proposalId', permission_grant.proposal_id)
		WHEN 'proposalVersion'
			THEN jsonb_build_object(
				'proposalVersionId', permission_grant.proposal_version_id
			)
		WHEN 'applicationForm'
			THEN jsonb_build_object(
				'applicationFormId', permission_grant.application_form_id
			)
		WHEN 'applicationFormField'
			THEN jsonb_build_object(
				'applicationFormFieldId', permission_grant.application_form_field_id
			)
		WHEN 'proposalFieldValue'
			THEN jsonb_build_object(
				'proposalFieldValueId', permission_grant.proposal_field_value_id
			)
		WHEN 'source'
			THEN jsonb_build_object('sourceId', permission_grant.source_id)
		WHEN 'bulkUpload'
			THEN jsonb_build_object(
				'bulkUploadTaskId', permission_grant.bulk_upload_task_id
			)
		WHEN 'changemakerFieldValue'
			THEN jsonb_build_object(
				'changemakerFieldValueId',
				permission_grant.changemaker_field_value_id
			)
	END;
END;
$$ LANGUAGE plpgsql;
