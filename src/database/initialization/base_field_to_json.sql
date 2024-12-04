SELECT drop_function('base_field_to_json');

CREATE FUNCTION base_field_to_json(base_field base_fields)
RETURNS jsonb AS $$
DECLARE
  localizations JSONB;
BEGIN
  localizations := (
    SELECT jsonb_object_agg(
      loc.language, base_field_localization_to_json(loc)
    )
    FROM base_field_localizations loc
    WHERE loc.base_field_id = base_field.id
  );

  RETURN jsonb_build_object(
    'id', base_field.id,
    'label', base_field.label,
    'description', base_field.description,
    'shortCode', base_field.short_code,
    'dataType', base_field.data_type,
    'scope', base_field.scope,
    'createdAt', to_json(base_field.created_at)::jsonb,
    'localizations', COALESCE(localizations, '{}')
  );
END;
$$ LANGUAGE plpgsql;
