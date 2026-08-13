SELECT drop_function('build_initiative_field_value_result');

CREATE FUNCTION build_initiative_field_value_result(
	initiative_field_value initiative_field_values
) RETURNS jsonb AS $$
DECLARE
	is_file_field BOOLEAN;
	base_field_json JSONB;
	source_json JSONB;
BEGIN
	PERFORM assert_initiative_field_value_not_forbidden(initiative_field_value);

	SELECT
		base_fields.data_type = 'file',
		base_field_to_json(base_fields.*)
	INTO is_file_field, base_field_json
	FROM base_fields
	WHERE base_fields.short_code = initiative_field_value.base_field_short_code;

	SELECT source_to_json(sources.*)
	INTO source_json
	FROM sources
	WHERE sources.id = initiative_field_value.source_id;

	RETURN initiative_field_value_to_json(
		initiative_field_value,
		base_field_json,
		source_json,
		initiative_field_value_file_to_json(initiative_field_value, is_file_field)
	);
END;
$$ LANGUAGE plpgsql STABLE;
