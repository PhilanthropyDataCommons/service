SELECT drop_function('permitted_changemaker_field_value_ids_among');

-- Returns the subset of `filter_ids` on which the user holds `verb` at `scope`.
-- Forbidden fields are never included; public fields are included for everyone
-- when the verb is `view`.
--
-- Bounding to `filter_ids` keeps the work proportional to the candidates rather
-- than every changemaker field value the user can see. Administrators skip the
-- grant branches: they already have every non-forbidden field, so those
-- branches can only return a subset of what they already get.
CREATE FUNCTION permitted_changemaker_field_value_ids_among(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	verb permission_grant_verb_t,
	scope permission_grant_entity_type_t,
	filter_ids int []
) RETURNS TABLE (id int) AS $$
	-- Public fields are viewable by any authenticated user.
	SELECT cfv.id
	FROM changemaker_field_values cfv
	INNER JOIN base_fields bf ON cfv.base_field_short_code = bf.short_code
	WHERE cfv.id = ANY(permitted_changemaker_field_value_ids_among.filter_ids)
		AND bf.sensitivity_classification = 'public'
		AND permitted_changemaker_field_value_ids_among.verb = 'view'

	UNION

	-- Administrators have all permissions, except on forbidden fields.
	SELECT cfv.id
	FROM changemaker_field_values cfv
	INNER JOIN base_fields bf ON cfv.base_field_short_code = bf.short_code
	WHERE cfv.id = ANY(permitted_changemaker_field_value_ids_among.filter_ids)
		AND bf.sensitivity_classification <> 'forbidden'
		AND permitted_changemaker_field_value_ids_among.user_is_admin

	UNION

	-- Granted directly on the changemaker field value.
	SELECT cfv.id
	FROM changemaker_field_values cfv
	INNER JOIN base_fields bf ON cfv.base_field_short_code = bf.short_code
	INNER JOIN permission_grants pg
		ON pg.context_entity_type = 'changemakerFieldValue'
		AND pg.changemaker_field_value_id = cfv.id
	WHERE cfv.id = ANY(permitted_changemaker_field_value_ids_among.filter_ids)
		AND NOT permitted_changemaker_field_value_ids_among.user_is_admin
		AND bf.sensitivity_classification <> 'forbidden'
		AND verb_set_permits_verb(
			pg.verbs, permitted_changemaker_field_value_ids_among.verb
		)
		AND scope_set_permits_scope(
			pg.scope, permitted_changemaker_field_value_ids_among.scope
		)
		AND grantee_permits_user(
			pg.grantee_type,
			pg.grantee_user_keycloak_user_id,
			pg.grantee_keycloak_organization_id,
			permitted_changemaker_field_value_ids_among.user_keycloak_user_id
		)

	UNION

	-- Inherited from the field value's changemaker.
	SELECT cfv.id
	FROM changemaker_field_values cfv
	INNER JOIN base_fields bf ON cfv.base_field_short_code = bf.short_code
	INNER JOIN permitted_changemaker_ids(
		permitted_changemaker_field_value_ids_among.user_keycloak_user_id,
		permitted_changemaker_field_value_ids_among.user_is_admin,
		permitted_changemaker_field_value_ids_among.verb,
		permitted_changemaker_field_value_ids_among.scope
	) AS permitted_changemakers
		ON permitted_changemakers.id = cfv.changemaker_id
	WHERE cfv.id = ANY(permitted_changemaker_field_value_ids_among.filter_ids)
		AND NOT permitted_changemaker_field_value_ids_among.user_is_admin
		AND bf.sensitivity_classification <> 'forbidden';
$$ LANGUAGE sql STABLE;
