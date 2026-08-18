SELECT drop_function('permitted_initiative_ids');

-- Returns the ids of initiatives on which the user holds `verb` at `scope`.
CREATE FUNCTION permitted_initiative_ids(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	verb permission_grant_verb_t,
	scope permission_grant_entity_type_t
) RETURNS TABLE (id int) AS $$
	-- Administrators have all permissions.
	SELECT initiatives.id
	FROM initiatives
	WHERE permitted_initiative_ids.user_is_admin

	UNION

	-- Granted directly on the initiative.
	SELECT pg.initiative_id
	FROM permission_grants pg
	WHERE pg.context_entity_type = 'initiative'
		AND verb_set_permits_verb(pg.verbs, permitted_initiative_ids.verb)
		AND scope_set_permits_scope(pg.scope, permitted_initiative_ids.scope)
		AND grantee_permits_user(
			pg.grantee_type,
			pg.grantee_user_keycloak_user_id,
			pg.grantee_keycloak_organization_id,
			permitted_initiative_ids.user_keycloak_user_id
		)

	UNION

	-- Inherited from the initiative's changemaker.
	SELECT initiatives.id
	FROM initiatives
	INNER JOIN permitted_changemaker_ids(
		permitted_initiative_ids.user_keycloak_user_id,
		permitted_initiative_ids.user_is_admin,
		permitted_initiative_ids.verb,
		permitted_initiative_ids.scope
	) AS permitted_changemakers
		ON initiatives.changemaker_id = permitted_changemakers.id;
$$ LANGUAGE sql STABLE;
