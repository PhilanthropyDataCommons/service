CREATE OR REPLACE FUNCTION base_field_to_json(base_field base_fields)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'id', base_field.id,
    'label', base_field.label,
    'description', base_field.description,
    'shortCode', base_field.short_code,
    'dataType', base_field.data_type,
    'scope', base_field.scope,
    'createdAt', to_json(base_field.created_at)::jsonb
  );
END;
$$ LANGUAGE plpgsql;
