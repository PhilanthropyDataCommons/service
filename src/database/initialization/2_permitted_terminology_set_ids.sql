SELECT drop_function('permitted_terminology_set_ids');

-- Returns the ids of terminology sets on which the user holds `verb` at
-- `scope`.
CREATE FUNCTION permitted_terminology_set_ids(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	verb permission_grant_verb_t,
	scope permission_grant_entity_type_t
) RETURNS TABLE (id int) AS $$
	-- Administrators have all permissions.
	SELECT terminology_sets.id
	FROM terminology_sets
	WHERE permitted_terminology_set_ids.user_is_admin

	UNION

	-- Granted directly on the terminology set.
	SELECT pg.terminology_set_id
	FROM permission_grants pg
	WHERE pg.context_entity_type = 'terminologySet'
		AND verb_set_permits_verb(pg.verbs, permitted_terminology_set_ids.verb)
		AND scope_set_permits_scope(pg.scope, permitted_terminology_set_ids.scope)
		AND grantee_permits_user(
			pg.grantee_type,
			pg.grantee_user_keycloak_user_id,
			pg.grantee_keycloak_organization_id,
			permitted_terminology_set_ids.user_keycloak_user_id
		)

	UNION

	-- Inherited from the terminology set's funder.
	SELECT terminology_sets.id
	FROM terminology_sets
	INNER JOIN permitted_funder_short_codes(
		permitted_terminology_set_ids.user_keycloak_user_id,
		permitted_terminology_set_ids.user_is_admin,
		permitted_terminology_set_ids.verb,
		permitted_terminology_set_ids.scope
	) AS permitted_funders
		ON terminology_sets.funder_short_code = permitted_funders.short_code;
$$ LANGUAGE sql STABLE;
