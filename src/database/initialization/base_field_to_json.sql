CREATE OR REPLACE FUNCTION base_field_to_json(base_field base_fields)
RETURNS JSONB AS $$
DECLARE
  base_field_localizations_json JSONB;
BEGIN
  SELECT jsonb_agg(
    base_field_localization_to_json(base_field_localizations.*)
    ORDER BY base_field_localizations.language DESC
  )
  INTO base_field_localizations_json
  FROM base_field_localizations
  WHERE base_field_localizations.base_field_id = base_field.id;

  RETURN jsonb_build_object(
    'id', base_field.id,
    'shortCode', base_field.short_code,
    'dataType', base_field.data_type,
    'localizations', COALESCE(base_field_localizations_json, '[]'::JSONB),
    'scope', base_field.scope,
    'createdAt', to_json(base_field.created_at)::jsonb
  );
END;
$$ LANGUAGE plpgsql;
