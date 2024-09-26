SELECT drop_function('proposal_field_value_to_json');

CREATE FUNCTION proposal_field_value_to_json(proposal_field_value proposal_field_values)
RETURNS JSONB AS $$
DECLARE
  application_form_field_json JSONB;
BEGIN
  SELECT application_form_field_to_json(application_form_fields.*)
  INTO application_form_field_json
  FROM application_form_fields
  WHERE application_form_fields.id = proposal_field_value.application_form_field_id;

  RETURN jsonb_build_object(
    'id', proposal_field_value.id,
    'proposalVersionId', proposal_field_value.proposal_version_id,
    'applicationFormFieldId', proposal_field_value.application_form_field_id,
    'applicationFormField', application_form_field_json,
    'position', proposal_field_value.position,
    'value', proposal_field_value.value,
    'isValid', proposal_field_value.is_valid,
    'createdAt', proposal_field_value.created_at
  );
END;
$$ LANGUAGE plpgsql;
