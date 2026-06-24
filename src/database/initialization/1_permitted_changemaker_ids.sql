SELECT drop_function('permitted_changemaker_ids');

-- Returns the ids of changemakers on which the user holds `verb` at `scope`.
CREATE FUNCTION permitted_changemaker_ids(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	verb permission_grant_verb_t,
	scope permission_grant_entity_type_t
) RETURNS TABLE (id int) AS $$
	-- Administrators have all permissions.
	SELECT changemakers.id
	FROM changemakers
	WHERE permitted_changemaker_ids.user_is_admin

	UNION

	-- Granted directly on the changemaker.
	SELECT pg.changemaker_id
	FROM permission_grants pg
	WHERE pg.context_entity_type = 'changemaker'
		AND verb_set_permits_verb(pg.verbs, permitted_changemaker_ids.verb)
		AND scope_set_permits_scope(
			pg.scope, permitted_changemaker_ids.scope
		)
		AND grantee_permits_user(
			pg.grantee_type,
			pg.grantee_user_keycloak_user_id,
			pg.grantee_keycloak_organization_id,
			permitted_changemaker_ids.user_keycloak_user_id
		);
$$ LANGUAGE sql STABLE;
