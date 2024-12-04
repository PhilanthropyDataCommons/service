SELECT drop_function('changemaker_to_json');

CREATE FUNCTION changemaker_to_json(
  changemaker changemakers,
  keycloakUserId uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  proposal_field_values_json JSONB;
BEGIN
  SELECT jsonb_agg(
    proposal_field_value_to_json(pfv_inner.*)
  )
  INTO proposal_field_values_json
  FROM (
    SELECT DISTINCT ON (bf.id) pfv.*
    FROM proposal_field_values pfv
    -- Remove field values for unauthenticated users while also (re)validating the user ID:
    INNER JOIN users u
      ON u.keycloak_user_id = keycloakUserId
    INNER JOIN application_form_fields aff
      ON pfv.application_form_field_id = aff.id
    INNER JOIN base_fields bf
      ON aff.base_field_id = bf.id
    INNER JOIN proposal_versions pv
      ON pfv.proposal_version_id = pv.id
    INNER JOIN changemakers_proposals op
      ON pv.proposal_id = op.proposal_id
    INNER JOIN sources s
      ON pv.source_id = s.id
    WHERE op.changemaker_id = changemaker.id
      AND bf.scope = 'organization'
      AND pfv.is_valid
      -- Guard against possible removal of NON NULL constraint on users table:
      AND u.keycloak_user_id IS NOT NULL
      -- Guard against the valid-but-not-really-valid-here system user:
      AND u.keycloak_user_id != system_keycloak_user_id()
      ORDER BY bf.id,
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
  ) AS pfv_inner;
  RETURN jsonb_build_object(
    'id', changemaker.id,
    'taxId', changemaker.tax_id,
    'name', changemaker.name,
    'createdAt', changemaker.created_at,
    'fields', COALESCE(proposal_field_values_json, '[]'::JSONB)
  );
END;
$$ LANGUAGE plpgsql;
