SELECT drop_function('changemaker_to_json');

CREATE FUNCTION changemaker_to_json(
	changemaker changemakers,
	auth_context_keycloak_user_id uuid DEFAULT NULL,
	shallow boolean DEFAULT FALSE
)
RETURNS jsonb AS $$
DECLARE
  proposal_field_values_json JSONB;
  fiscal_sponsors_json JSONB;
  changemaker_json JSONB;
BEGIN
  -- Terminate changemaker recursion by setting shallow here. This means no fields or sponsors in sponsors.
  SELECT jsonb_agg(changemaker_to_json(fiscal_sponsors.*, auth_context_keycloak_user_id, TRUE))
  INTO fiscal_sponsors_json
  FROM changemakers AS fiscal_sponsors
  INNER JOIN fiscal_sponsorships fs
    ON fs.fiscal_sponsor_changemaker_id = fiscal_sponsors.id
    AND fs.fiscal_sponsee_changemaker_id = changemaker.id
    AND NOT is_expired(fs.not_after)
  -- Remove values for unauthenticated calls while also (re)validating the user ID:
  INNER JOIN users u
    ON u.keycloak_user_id = auth_context_keycloak_user_id
  WHERE NOT shallow;
  SELECT jsonb_agg(
    proposal_field_value_to_json(pfv_inner.*)
  )
  INTO proposal_field_values_json
  FROM (
    SELECT DISTINCT ON (bf.short_code) pfv.*
    FROM proposal_field_values pfv
    -- Remove field values for unauthenticated users while also (re)validating the user ID:
    INNER JOIN users u
      ON u.keycloak_user_id = auth_context_keycloak_user_id
    INNER JOIN application_form_fields aff
      ON pfv.application_form_field_id = aff.id
    INNER JOIN base_fields bf
      ON aff.base_field_short_code = bf.short_code
    INNER JOIN proposal_versions pv
      ON pfv.proposal_version_id = pv.id
    INNER JOIN changemakers_proposals op
      ON pv.proposal_id = op.proposal_id
    INNER JOIN sources s
      ON pv.source_id = s.id
    WHERE op.changemaker_id = changemaker.id
      AND bf.scope = 'organization'
			AND bf.sensitivity_classification != 'forbidden'
      AND pfv.is_valid
      -- Guard against possible removal of NON NULL constraint on users table:
      AND u.keycloak_user_id IS NOT NULL
      -- Guard against the valid-but-not-really-valid-here system user:
      AND u.keycloak_user_id != system_keycloak_user_id()
      ORDER BY bf.short_code,
        -- The three "Source" sorts are as a class, not on an individual column within the class.
        -- In other words, if there are many funders that sourced data, they are treated equally
        -- until further sorted by the remaining (non-Source) sort clauses.
        -- Changemaker sourced data takes priority over funders and data platform providers.
        s.changemaker_id IS NOT NULL DESC,
        -- Funder sourced data takes priority over data platform providers.
        s.funder_short_code IS NOT NULL DESC,
        -- Data platform provider sourced data takes priority over old, default-pdc-sourced data.
        s.data_provider_short_code IS NOT NULL
          AND s.id != system_source_id() DESC,
        pfv.created_at DESC
  ) AS pfv_inner
  WHERE NOT shallow;
  SELECT jsonb_build_object(
    'id', changemaker.id,
    'taxId', changemaker.tax_id,
    'name', changemaker.name,
    'keycloakOrganizationId', changemaker.keycloak_organization_id,
    'createdAt', changemaker.created_at
  ) INTO changemaker_json;
  RETURN
    CASE WHEN shallow THEN
      changemaker_json
    ELSE
      changemaker_json || jsonb_build_object(
        'fiscalSponsors', COALESCE(fiscal_sponsors_json, '[]'::JSONB),
        'fields', COALESCE(proposal_field_values_json, '[]'::JSONB)
      )
    END;
END;
$$ LANGUAGE plpgsql;
