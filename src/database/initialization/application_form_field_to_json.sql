SELECT drop_function('application_form_field_to_json');

CREATE FUNCTION application_form_field_to_json(
	application_form_field application_form_fields
)
RETURNS jsonb AS $$
DECLARE
  base_field_json JSONB;
BEGIN
  SELECT base_field_to_json(base_fields.*)
  INTO base_field_json
  FROM base_fields
  WHERE base_fields.id = application_form_field.base_field_id;

  RETURN jsonb_build_object(
    'id', application_form_field.id,
    'applicationFormId', application_form_field.application_form_id,
    'baseFieldId', application_form_field.base_field_id,
    'baseField', base_field_json,
    'position', application_form_field.position,
    'label', application_form_field.label,
    'createdAt', application_form_field.created_at
  );
END;
$$ LANGUAGE plpgsql;
