SELECT drop_function('permitted_funder_short_codes');

-- Returns the short codes of funders on which the user holds `verb` at `scope`.
CREATE FUNCTION permitted_funder_short_codes(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	verb permission_grant_verb_t,
	scope permission_grant_entity_type_t
) RETURNS TABLE (short_code short_code_t) AS $$
	-- Administrators have all permissions.
	SELECT funders.short_code
	FROM funders
	WHERE permitted_funder_short_codes.user_is_admin

	UNION

	-- Granted directly on the funder.
	SELECT pg.funder_short_code
	FROM permission_grants pg
	WHERE pg.context_entity_type = 'funder'
		AND verb_set_permits_verb(pg.verbs, permitted_funder_short_codes.verb)
		AND scope_set_permits_scope(
			pg.scope, permitted_funder_short_codes.scope
		)
		AND grantee_permits_user(
			pg.grantee_type,
			pg.grantee_user_keycloak_user_id,
			pg.grantee_keycloak_organization_id,
			permitted_funder_short_codes.user_keycloak_user_id
		);
$$ LANGUAGE sql STABLE;
