SELECT drop_function('permitted_permission_grant_ids');

-- Returns the ids of permission grants the user may manage: every grant for
-- administrators, otherwise grants whose context entity the user can manage.
CREATE FUNCTION permitted_permission_grant_ids(
	user_keycloak_user_id uuid,
	user_is_admin boolean
) RETURNS TABLE (id int) AS $$
	-- Administrators may manage every grant.
	SELECT permission_grants.id
	FROM permission_grants
	WHERE permitted_permission_grant_ids.user_is_admin

	UNION

	SELECT pg.id
	FROM permission_grants pg
	INNER JOIN permitted_funder_short_codes(
		permitted_permission_grant_ids.user_keycloak_user_id,
		permitted_permission_grant_ids.user_is_admin,
		'manage',
		'funder'
	) AS permitted_funders ON permitted_funders.short_code = pg.funder_short_code
	WHERE pg.context_entity_type = 'funder'

	UNION

	SELECT pg.id
	FROM permission_grants pg
	INNER JOIN permitted_data_provider_short_codes(
		permitted_permission_grant_ids.user_keycloak_user_id,
		permitted_permission_grant_ids.user_is_admin,
		'manage',
		'dataProvider'
	) AS permitted_data_providers
		ON permitted_data_providers.short_code = pg.data_provider_short_code
	WHERE pg.context_entity_type = 'dataProvider'

	UNION

	SELECT pg.id
	FROM permission_grants pg
	INNER JOIN permitted_changemaker_ids(
		permitted_permission_grant_ids.user_keycloak_user_id,
		permitted_permission_grant_ids.user_is_admin,
		'manage',
		'changemaker'
	) AS permitted_changemakers ON permitted_changemakers.id = pg.changemaker_id
	WHERE pg.context_entity_type = 'changemaker'

	UNION

	SELECT pg.id
	FROM permission_grants pg
	INNER JOIN permitted_opportunity_ids(
		permitted_permission_grant_ids.user_keycloak_user_id,
		permitted_permission_grant_ids.user_is_admin,
		'manage',
		'opportunity'
	) AS permitted_opportunities ON permitted_opportunities.id = pg.opportunity_id
	WHERE pg.context_entity_type = 'opportunity'

	UNION

	SELECT pg.id
	FROM permission_grants pg
	INNER JOIN permitted_source_ids(
		permitted_permission_grant_ids.user_keycloak_user_id,
		permitted_permission_grant_ids.user_is_admin,
		'manage',
		'source'
	) AS permitted_sources ON permitted_sources.id = pg.source_id
	WHERE pg.context_entity_type = 'source'

	UNION

	SELECT pg.id
	FROM permission_grants pg
	INNER JOIN permitted_application_form_ids(
		permitted_permission_grant_ids.user_keycloak_user_id,
		permitted_permission_grant_ids.user_is_admin,
		'manage',
		'applicationForm'
	) AS permitted_application_forms
		ON permitted_application_forms.id = pg.application_form_id
	WHERE pg.context_entity_type = 'applicationForm'

	UNION

	SELECT pg.id
	FROM permission_grants pg
	INNER JOIN permitted_proposal_ids(
		permitted_permission_grant_ids.user_keycloak_user_id,
		permitted_permission_grant_ids.user_is_admin,
		'manage',
		'proposal'
	) AS permitted_proposals ON permitted_proposals.id = pg.proposal_id
	WHERE pg.context_entity_type = 'proposal'

	UNION

	SELECT pg.id
	FROM permission_grants pg
	INNER JOIN permitted_changemaker_field_value_ids(
		permitted_permission_grant_ids.user_keycloak_user_id,
		permitted_permission_grant_ids.user_is_admin,
		'manage',
		'changemakerFieldValue'
	) AS permitted_field_values
		ON permitted_field_values.id = pg.changemaker_field_value_id
	WHERE pg.context_entity_type = 'changemakerFieldValue'

	UNION

	SELECT pg.id
	FROM permission_grants pg
	INNER JOIN permitted_proposal_field_value_ids(
		permitted_permission_grant_ids.user_keycloak_user_id,
		permitted_permission_grant_ids.user_is_admin,
		'manage',
		'proposalFieldValue'
	) AS permitted_field_values
		ON permitted_field_values.id = pg.proposal_field_value_id
	WHERE pg.context_entity_type = 'proposalFieldValue';
$$ LANGUAGE sql STABLE;
