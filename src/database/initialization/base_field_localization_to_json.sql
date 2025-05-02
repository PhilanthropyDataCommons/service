SELECT drop_function('base_field_localization_to_json');

CREATE FUNCTION base_field_localization_to_json(
	base_field_localization base_field_localizations
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'baseFieldShortCode', base_field_localization.base_field_short_code,
    'language', base_field_localization.language,
    'label', base_field_localization.label,
    'description', base_field_localization.description,
    'createdAt', to_json(base_field_localization.created_at)::jsonb
  );
END;
$$ LANGUAGE plpgsql;
