SELECT drop_function('can_manage_permission_grant');

CREATE FUNCTION can_manage_permission_grant(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	permission_grant permission_grants
) RETURNS boolean AS $$
BEGIN
	IF user_is_admin THEN
		RETURN TRUE;
	END IF;

	CASE permission_grant.context_entity_type
		WHEN 'funder' THEN
			RETURN has_funder_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.funder_short_code,
				'manage',
				'funder'
			);
		WHEN 'changemaker' THEN
			RETURN has_changemaker_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.changemaker_id,
				'manage',
				'changemaker'
			);
		WHEN 'dataProvider' THEN
			RETURN has_data_provider_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.data_provider_short_code,
				'manage',
				'dataProvider'
			);
		WHEN 'opportunity' THEN
			RETURN has_opportunity_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.opportunity_id,
				'manage',
				'opportunity'
			);
		WHEN 'proposal' THEN
			RETURN has_proposal_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.proposal_id,
				'manage',
				'proposal'
			);
		WHEN 'applicationForm' THEN
			RETURN has_application_form_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.application_form_id,
				'manage',
				'applicationForm'
			);
		WHEN 'proposalFieldValue' THEN
			RETURN has_proposal_field_value_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.proposal_field_value_id,
				'manage',
				'proposalFieldValue'
			);
		WHEN 'source' THEN
			RETURN has_source_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.source_id,
				'manage',
				'source'
			);
		WHEN 'changemakerFieldValue' THEN
			RETURN has_changemaker_field_value_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.changemaker_field_value_id,
				'manage',
				'changemakerFieldValue'
			);
		WHEN 'terminologySet' THEN
			RETURN has_terminology_set_permission(
				user_keycloak_user_id,
				user_is_admin,
				permission_grant.terminology_set_id,
				'manage',
				'terminologySet'
			);
		WHEN 'applicationFormField', 'proposalVersion', 'bulkUpload' THEN
			-- Permission checks are not enforced for these context entity types;
			-- only administrators may manage such grants.
			RETURN FALSE;
		ELSE
			RAISE EXCEPTION
				'Cannot manage permission grant with unsupported context entity type "%"',
				permission_grant.context_entity_type;
	END CASE;
END;
$$ LANGUAGE plpgsql;
