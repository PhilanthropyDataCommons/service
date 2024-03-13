CREATE OR REPLACE FUNCTION proposal_version_to_json(proposal_version proposal_versions)
RETURNS JSONB AS $$
DECLARE
  proposal_field_values_json JSONB;
BEGIN
  SELECT jsonb_agg(
    proposal_field_value_to_json(proposal_field_values.*)
    ORDER BY proposal_field_values.position, proposal_field_values.id DESC
  )
  INTO proposal_field_values_json
  FROM proposal_field_values
  WHERE proposal_field_values.proposal_version_id = proposal_version.id;

  RETURN jsonb_build_object(
    'id', proposal_version.id,
    'proposalId', proposal_version.proposal_id,
    'applicationFormId', proposal_version.application_form_id,
    'version', proposal_version.version,
    'fieldValues', COALESCE(proposal_field_values_json, '[]'::JSONB),
    'createdAt', proposal_version.created_at
  );
END;
$$ LANGUAGE plpgsql;
