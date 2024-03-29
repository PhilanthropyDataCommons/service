CREATE OR REPLACE FUNCTION application_form_to_json(application_form application_forms)
RETURNS JSONB AS $$
DECLARE
  application_form_fields_json JSONB;
BEGIN
  SELECT jsonb_agg(
    application_form_field_to_json(application_form_fields.*)
    ORDER BY application_form_fields.position, application_form_fields.id
  )
  INTO application_form_fields_json
  FROM application_form_fields
  WHERE application_form_fields.application_form_id = application_form.id;

  RETURN jsonb_build_object(
    'id', application_form.id,
    'opportunityId', application_form.opportunity_id,
    'version', application_form.version,
    'fields', COALESCE(application_form_fields_json, '[]'::JSONB),
    'createdAt', application_form.created_at
  );
END;
$$ LANGUAGE plpgsql;
