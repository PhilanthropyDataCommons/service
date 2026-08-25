SELECT drop_function('permitted_initiative_field_value_ids');

-- Every initiative field value the user may access for `verb` at `scope`.
-- Forbidden fields are never included; public fields are included for any
-- authenticated user when `verb` is `view`; otherwise access is granted on the
-- field value or inherited from its initiative or the initiative's changemaker,
-- subject to the grant's base field category `conditions`.
--
-- The inheritance is expanded here rather than reusing permitted_initiative_ids
-- because the per-field-value category conditions cannot be expressed at the
-- initiative level.
CREATE FUNCTION permitted_initiative_field_value_ids(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	verb permission_grant_verb_t,
	scope permission_grant_entity_type_t
) RETURNS TABLE (id int) AS $$
	-- Public fields are viewable by any authenticated user.
	SELECT ifv.id
	FROM initiative_field_values ifv
	INNER JOIN base_fields bf ON ifv.base_field_short_code = bf.short_code
	WHERE bf.sensitivity_classification = 'public'
		AND permitted_initiative_field_value_ids.verb = 'view'

	UNION

	-- Administrators have all permissions, except on forbidden fields.
	SELECT ifv.id
	FROM initiative_field_values ifv
	INNER JOIN base_fields bf ON ifv.base_field_short_code = bf.short_code
	WHERE bf.sensitivity_classification <> 'forbidden'
		AND permitted_initiative_field_value_ids.user_is_admin

	UNION

	-- Granted on the field value or inherited from its initiative or the
	-- initiative's changemaker -- subject to the grant's base field conditions.
	SELECT ifv.id
	FROM initiative_field_values ifv
	INNER JOIN base_fields bf ON ifv.base_field_short_code = bf.short_code
	INNER JOIN initiatives i ON ifv.initiative_id = i.id
	INNER JOIN permission_grants pg
		ON (
			(
				pg.context_entity_type = 'initiativeFieldValue'
				AND pg.initiative_field_value_id = ifv.id
			)
			OR (
				pg.context_entity_type = 'initiative'
				AND pg.initiative_id = ifv.initiative_id
			)
			OR (
				pg.context_entity_type = 'changemaker'
				AND pg.changemaker_id = i.changemaker_id
			)
		)
	WHERE bf.sensitivity_classification <> 'forbidden'
		AND verb_set_permits_verb(
			pg.verbs, permitted_initiative_field_value_ids.verb
		)
		AND scope_set_permits_scope(
			pg.scope, permitted_initiative_field_value_ids.scope
		)
		AND grantee_permits_user(
			pg.grantee_type,
			pg.grantee_user_keycloak_user_id,
			pg.grantee_keycloak_organization_id,
			permitted_initiative_field_value_ids.user_keycloak_user_id
		)
		AND (
			pg.conditions IS NULL
			OR NOT pg.conditions ? 'initiativeFieldValue'
			OR (
				pg.conditions #>> '{initiativeFieldValue,property}'
				= 'baseFieldCategory'
				AND pg.conditions #>> '{initiativeFieldValue,operator}' = 'in'
				AND bf.category::text IN (
					SELECT jsonb_array_elements_text(
						pg.conditions #> '{initiativeFieldValue,value}'
					)
				)
			)
		);
$$ LANGUAGE sql STABLE;
