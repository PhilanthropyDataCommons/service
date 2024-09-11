-- An explicit DROP is needed to remove the old function instead of overloading it.
DROP FUNCTION IF EXISTS organization_to_json(organizations);
CREATE OR REPLACE FUNCTION organization_to_json(organization organizations, authenticationId VARCHAR DEFAULT NULL)
RETURNS JSONB AS $$
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
      ON u.authentication_id = authenticationId
    INNER JOIN application_form_fields aff
      ON pfv.application_form_field_id = aff.id
    INNER JOIN base_fields bf
      ON aff.base_field_id = bf.id
    INNER JOIN proposal_versions pv
      ON pfv.proposal_version_id = pv.id
    INNER JOIN organizations_proposals op
      ON pv.proposal_id = op.proposal_id
    WHERE op.organization_id = organization.id
      AND bf.scope = 'organization'
      AND pfv.is_valid
      -- Guard against possible removal of NON NULL constraint on users table:
      AND u.authentication_id IS NOT NULL
      -- Guard against the valid-but-not-really-valid-here system user:
      AND u.authentication_id != ''
      ORDER BY bf.id,
        pfv.created_at DESC
  ) AS pfv_inner;
  RETURN jsonb_build_object(
    'id', organization.id,
    'taxId', organization.tax_id,
    'name', organization.name,
    'createdAt', organization.created_at,
    'fields', COALESCE(proposal_field_values_json, '[]'::JSONB)
  );
END;
$$ LANGUAGE plpgsql;
