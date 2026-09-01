SELECT drop_function('permitted_changemaker_ids_among');

-- Returns the subset of `filter_ids` on which the user holds `verb` at `scope`.
--
-- Bounding to `filter_ids` keeps the work proportional to the candidates rather
-- than every changemaker the user can see. Administrators would otherwise
-- enumerate the whole changemakers table on each request.
CREATE FUNCTION permitted_changemaker_ids_among(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	verb permission_grant_verb_t,
	scope permission_grant_entity_type_t,
	filter_ids int[]
) RETURNS TABLE (id int) AS $$
	-- Administrators have all permissions.
	SELECT changemakers.id
	FROM changemakers
	WHERE changemakers.id = ANY(permitted_changemaker_ids_among.filter_ids)
		AND permitted_changemaker_ids_among.user_is_admin

	UNION

	-- Granted directly on the changemaker.
	SELECT pg.changemaker_id
	FROM permission_grants pg
	WHERE pg.changemaker_id = ANY(permitted_changemaker_ids_among.filter_ids)
		AND pg.context_entity_type = 'changemaker'
		AND verb_set_permits_verb(pg.verbs, permitted_changemaker_ids_among.verb)
		AND scope_set_permits_scope(
			pg.scope, permitted_changemaker_ids_among.scope
		)
		AND grantee_permits_user(
			pg.grantee_type,
			pg.grantee_user_keycloak_user_id,
			pg.grantee_keycloak_organization_id,
			permitted_changemaker_ids_among.user_keycloak_user_id
		);
$$ LANGUAGE sql STABLE;
