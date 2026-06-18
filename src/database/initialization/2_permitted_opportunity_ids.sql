SELECT drop_function('permitted_opportunity_ids');

-- Returns the ids of opportunities on which the user holds `verb` at `scope`.
CREATE FUNCTION permitted_opportunity_ids(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	verb permission_grant_verb_t,
	scope permission_grant_entity_type_t
) RETURNS TABLE (id int) AS $$
	-- Administrators have all permissions.
	SELECT opportunities.id
	FROM opportunities
	WHERE permitted_opportunity_ids.user_is_admin

	UNION

	-- Granted directly on the opportunity.
	SELECT pg.opportunity_id
	FROM permission_grants pg
	WHERE pg.context_entity_type = 'opportunity'
		AND verb_set_permits_verb(pg.verbs, permitted_opportunity_ids.verb)
		AND scope_set_permits_scope(
			pg.scope, permitted_opportunity_ids.scope
		)
		AND grantee_permits_user(
			pg.grantee_type,
			pg.grantee_user_keycloak_user_id,
			pg.grantee_keycloak_organization_id,
			permitted_opportunity_ids.user_keycloak_user_id
		)

	UNION

	-- Inherited from the opportunity's funder.
	SELECT opportunities.id
	FROM opportunities
	INNER JOIN permitted_funder_short_codes(
		permitted_opportunity_ids.user_keycloak_user_id,
		permitted_opportunity_ids.user_is_admin,
		permitted_opportunity_ids.verb,
		permitted_opportunity_ids.scope
	) AS permitted_funders
		ON opportunities.funder_short_code = permitted_funders.short_code;
$$ LANGUAGE sql STABLE;
