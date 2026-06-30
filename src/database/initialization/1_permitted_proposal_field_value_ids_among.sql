SELECT drop_function('permitted_proposal_field_value_ids_among');

-- Returns the subset of `filter_ids` that the user may access for `verb` at
-- `scope`. Forbidden fields are never included; public fields are included for
-- any authenticated user when `verb` is `view`; otherwise access is granted on
-- the field value or inherited from its proposal, opportunity, funder, or
-- changemaker, subject to the grant's base field category `conditions`.
--
-- The inheritance is expanded here rather than reusing permitted_proposal_ids
-- because the per-field-value category conditions cannot be expressed at the
-- proposal level. Taking the ids as a parameter keeps the work proportional to
-- the candidates instead of every field value the user can see.
CREATE FUNCTION permitted_proposal_field_value_ids_among(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	verb permission_grant_verb_t,
	scope permission_grant_entity_type_t,
	filter_ids int []
) RETURNS TABLE (id int) AS $$
	-- Public fields are viewable by any authenticated user.
	SELECT pfv.id
	FROM unnest(
		permitted_proposal_field_value_ids_among.filter_ids
	) AS candidate (id)
	INNER JOIN proposal_field_values pfv ON pfv.id = candidate.id
	INNER JOIN application_form_fields aff
		ON pfv.application_form_field_id = aff.id
	INNER JOIN base_fields bf ON aff.base_field_short_code = bf.short_code
	WHERE bf.sensitivity_classification = 'public'
		AND permitted_proposal_field_value_ids_among.verb = 'view'

	UNION

	-- Administrators have all permissions, except on forbidden fields.
	SELECT pfv.id
	FROM unnest(
		permitted_proposal_field_value_ids_among.filter_ids
	) AS candidate (id)
	INNER JOIN proposal_field_values pfv ON pfv.id = candidate.id
	INNER JOIN application_form_fields aff
		ON pfv.application_form_field_id = aff.id
	INNER JOIN base_fields bf ON aff.base_field_short_code = bf.short_code
	WHERE bf.sensitivity_classification <> 'forbidden'
		AND permitted_proposal_field_value_ids_among.user_is_admin

	UNION

	-- Granted on the field value or inherited from its proposal, opportunity,
	-- funder, or changemaker -- subject to the grant's base field conditions.
	SELECT pfv.id
	FROM unnest(
		permitted_proposal_field_value_ids_among.filter_ids
	) AS candidate (id)
	INNER JOIN proposal_field_values pfv ON pfv.id = candidate.id
	INNER JOIN application_form_fields aff
		ON pfv.application_form_field_id = aff.id
	INNER JOIN base_fields bf ON aff.base_field_short_code = bf.short_code
	INNER JOIN proposal_versions pv ON pfv.proposal_version_id = pv.id
	INNER JOIN proposals p ON pv.proposal_id = p.id
	INNER JOIN opportunities o ON p.opportunity_id = o.id
	LEFT JOIN changemakers_proposals cp ON cp.proposal_id = p.id
	INNER JOIN permission_grants pg
		ON (
			(
				pg.context_entity_type = 'proposalFieldValue'
				AND pg.proposal_field_value_id = pfv.id
			)
			OR (
				pg.context_entity_type = 'proposal'
				AND pg.proposal_id = pv.proposal_id
			)
			OR (
				pg.context_entity_type = 'opportunity'
				AND pg.opportunity_id = p.opportunity_id
			)
			OR (
				pg.context_entity_type = 'funder'
				AND pg.funder_short_code = o.funder_short_code
			)
			OR (
				pg.context_entity_type = 'changemaker'
				AND pg.changemaker_id = cp.changemaker_id
			)
		)
	WHERE bf.sensitivity_classification <> 'forbidden'
		AND verb_set_permits_verb(
			pg.verbs, permitted_proposal_field_value_ids_among.verb
		)
		AND scope_set_permits_scope(
			pg.scope, permitted_proposal_field_value_ids_among.scope
		)
		AND grantee_permits_user(
			pg.grantee_type,
			pg.grantee_user_keycloak_user_id,
			pg.grantee_keycloak_organization_id,
			permitted_proposal_field_value_ids_among.user_keycloak_user_id
		)
		AND (
			pg.conditions IS NULL
			OR NOT pg.conditions ? 'proposalFieldValue'
			OR (
				pg.conditions #>> '{proposalFieldValue,property}'
				= 'baseFieldCategory'
				AND pg.conditions #>> '{proposalFieldValue,operator}' = 'in'
				AND bf.category::text IN (
					SELECT jsonb_array_elements_text(
						pg.conditions #> '{proposalFieldValue,value}'
					)
				)
			)
		);
$$ LANGUAGE sql STABLE;
