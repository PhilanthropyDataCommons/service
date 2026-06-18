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
			RETURN EXISTS (
				SELECT 1
				FROM permitted_funder_short_codes(
					user_keycloak_user_id,
					user_is_admin,
					'manage',
					'funder'
				) AS permitted_funders
				WHERE permitted_funders.short_code = permission_grant.funder_short_code
			);
		WHEN 'changemaker' THEN
			RETURN EXISTS (
				SELECT 1
				FROM permitted_changemaker_ids(
					user_keycloak_user_id,
					user_is_admin,
					'manage',
					'changemaker'
				) AS permitted_changemakers
				WHERE permitted_changemakers.id = permission_grant.changemaker_id
			);
		WHEN 'dataProvider' THEN
			RETURN EXISTS (
				SELECT 1
				FROM permitted_data_provider_short_codes(
					user_keycloak_user_id,
					user_is_admin,
					'manage',
					'dataProvider'
				) AS permitted_data_providers
				WHERE
					permitted_data_providers.short_code
					= permission_grant.data_provider_short_code
			);
		WHEN 'opportunity' THEN
			RETURN EXISTS (
				SELECT 1
				FROM permitted_opportunity_ids(
					user_keycloak_user_id,
					user_is_admin,
					'manage',
					'opportunity'
				) AS permitted_opportunities
				WHERE permitted_opportunities.id = permission_grant.opportunity_id
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
			RETURN EXISTS (
				SELECT 1
				FROM permitted_application_form_ids(
					user_keycloak_user_id,
					user_is_admin,
					'manage',
					'applicationForm'
				) AS permitted_application_forms
				WHERE
					permitted_application_forms.id
					= permission_grant.application_form_id
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
$$ LANGUAGE plpgsql STABLE;
