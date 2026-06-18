SELECT drop_function('permitted_proposal_field_value_ids');

-- Returns the ids of proposal field values on which the user holds `verb` at
-- `scope`. Forbidden fields are never included; public fields are included for
-- everyone when the verb is `view`. A grant's `conditions` can further narrow
-- it to particular base field categories.
--
-- Unlike the other inheriting functions this does not compose on
-- permitted_proposal_ids: the base field category conditions are evaluated per
-- field value, which a proposal-level set cannot express, so the inheritance is
-- expanded here.
CREATE FUNCTION permitted_proposal_field_value_ids(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	verb permission_grant_verb_t,
	scope permission_grant_entity_type_t
) RETURNS TABLE (id int) AS $$
	-- Public fields are viewable by any authenticated user.
	SELECT pfv.id
	FROM proposal_field_values pfv
	INNER JOIN application_form_fields aff
		ON pfv.application_form_field_id = aff.id
	INNER JOIN base_fields bf ON aff.base_field_short_code = bf.short_code
	WHERE bf.sensitivity_classification = 'public'
		AND permitted_proposal_field_value_ids.verb = 'view'

	UNION

	-- Administrators have all permissions, except on forbidden fields.
	SELECT pfv.id
	FROM proposal_field_values pfv
	INNER JOIN application_form_fields aff
		ON pfv.application_form_field_id = aff.id
	INNER JOIN base_fields bf ON aff.base_field_short_code = bf.short_code
	WHERE bf.sensitivity_classification <> 'forbidden'
		AND permitted_proposal_field_value_ids.user_is_admin

	UNION

	-- Granted on the field value or inherited from its proposal, opportunity,
	-- funder, or changemaker -- subject to the grant's base field conditions.
	SELECT pfv.id
	FROM proposal_field_values pfv
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
			pg.verbs, permitted_proposal_field_value_ids.verb
		)
		AND scope_set_permits_scope(
			pg.scope, permitted_proposal_field_value_ids.scope
		)
		AND grantee_permits_user(
			pg.grantee_type,
			pg.grantee_user_keycloak_user_id,
			pg.grantee_keycloak_organization_id,
			permitted_proposal_field_value_ids.user_keycloak_user_id
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
