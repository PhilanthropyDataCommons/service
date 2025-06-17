SELECT drop_function('application_form_to_json');

CREATE FUNCTION application_form_to_json(application_form application_forms)
RETURNS jsonb AS $$
DECLARE
  application_form_fields_json JSONB;
BEGIN
  SELECT jsonb_agg(
    application_form_field_to_json(application_form_fields.*)
    ORDER BY application_form_fields.position, application_form_fields.id
  )
  INTO application_form_fields_json
  FROM application_form_fields
	JOIN base_fields ON application_form_fields.base_field_short_code = base_fields.short_code
	WHERE application_form_fields.application_form_id = application_form.id
		AND base_fields.sensitivity_classification != 'forbidden';

  RETURN jsonb_build_object(
    'id', application_form.id,
    'opportunityId', application_form.opportunity_id,
    'version', application_form.version,
    'fields', COALESCE(application_form_fields_json, '[]'::JSONB),
    'createdAt', application_form.created_at
  );
END;
$$ LANGUAGE plpgsql;
