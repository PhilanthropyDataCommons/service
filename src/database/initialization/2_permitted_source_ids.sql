SELECT drop_function('permitted_source_ids');

-- Returns the ids of sources on which the user holds `verb` at `scope`.
CREATE FUNCTION permitted_source_ids(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	verb permission_grant_verb_t,
	scope permission_grant_entity_type_t
) RETURNS TABLE (id int) AS $$
	-- Administrators have all permissions.
	SELECT sources.id
	FROM sources
	WHERE permitted_source_ids.user_is_admin

	UNION

	-- Granted directly on the source.
	SELECT pg.source_id
	FROM permission_grants pg
	WHERE pg.context_entity_type = 'source'
		AND verb_set_permits_verb(pg.verbs, permitted_source_ids.verb)
		AND scope_set_permits_scope(pg.scope, permitted_source_ids.scope)
		AND grantee_permits_user(
			pg.grantee_type,
			pg.grantee_user_keycloak_user_id,
			pg.grantee_keycloak_organization_id,
			permitted_source_ids.user_keycloak_user_id
		)

	UNION

	-- Inherited from the source's funder.
	SELECT sources.id
	FROM sources
	INNER JOIN permitted_funder_short_codes(
		permitted_source_ids.user_keycloak_user_id,
		permitted_source_ids.user_is_admin,
		permitted_source_ids.verb,
		permitted_source_ids.scope
	) AS permitted_funders
		ON sources.funder_short_code = permitted_funders.short_code

	UNION

	-- Inherited from the source's data provider.
	SELECT sources.id
	FROM sources
	INNER JOIN permitted_data_provider_short_codes(
		permitted_source_ids.user_keycloak_user_id,
		permitted_source_ids.user_is_admin,
		permitted_source_ids.verb,
		permitted_source_ids.scope
	) AS permitted_data_providers
		ON sources.data_provider_short_code = permitted_data_providers.short_code

	UNION

	-- Inherited from the source's changemaker.
	SELECT sources.id
	FROM sources
	INNER JOIN permitted_changemaker_ids(
		permitted_source_ids.user_keycloak_user_id,
		permitted_source_ids.user_is_admin,
		permitted_source_ids.verb,
		permitted_source_ids.scope
	) AS permitted_changemakers
		ON sources.changemaker_id = permitted_changemakers.id;
$$ LANGUAGE sql STABLE;
