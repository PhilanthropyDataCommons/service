CREATE OR REPLACE FUNCTION can_manage_permission_grant(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	permission_grant permission_grants
) RETURNS boolean AS $$
BEGIN
	IF user_is_admin THEN
		RETURN TRUE;
	END IF;

	RETURN CASE permission_grant.context_entity_type
		WHEN 'funder' THEN
			has_funder_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.funder_short_code,
				'manage',
				'funder'
			)
		WHEN 'changemaker' THEN
			has_changemaker_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.changemaker_id,
				'manage',
				'changemaker'
			)
		WHEN 'dataProvider' THEN
			has_data_provider_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.data_provider_short_code,
				'manage',
				'dataProvider'
			)
		WHEN 'opportunity' THEN
			has_opportunity_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.opportunity_id,
				'manage',
				'opportunity'
			)
		WHEN 'proposal' THEN
			has_proposal_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.proposal_id,
				'manage',
				'proposal'
			)
		WHEN 'proposalVersion' THEN
			has_proposal_version_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.proposal_version_id,
				'manage',
				'proposalVersion'
			)
		WHEN 'applicationForm' THEN
			has_application_form_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.application_form_id,
				'manage',
				'applicationForm'
			)
		WHEN 'applicationFormField' THEN
			has_application_form_field_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.application_form_field_id,
				'manage',
				'applicationFormField'
			)
		WHEN 'proposalFieldValue' THEN
			has_proposal_field_value_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.proposal_field_value_id,
				'manage',
				'proposalFieldValue'
			)
		WHEN 'source' THEN
			has_source_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.source_id,
				'manage',
				'source'
			)
		WHEN 'bulkUpload' THEN
			has_bulk_upload_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.bulk_upload_task_id,
				'manage',
				'bulkUpload'
			)
		WHEN 'changemakerFieldValue' THEN
			has_changemaker_field_value_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.changemaker_field_value_id,
				'manage',
				'changemakerFieldValue'
			)
	END;
END;
$$ LANGUAGE plpgsql STABLE;
