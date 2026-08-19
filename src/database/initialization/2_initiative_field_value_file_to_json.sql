SELECT drop_function('initiative_field_value_file_to_json');

CREATE FUNCTION initiative_field_value_file_to_json(
	initiative_field_value initiative_field_values,
	is_file_field boolean
) RETURNS jsonb AS $$
	SELECT file_to_json(files.*)
	FROM files
	WHERE initiative_field_value_file_to_json.is_file_field
		AND initiative_field_value.value ~ '^[0-9]+$'
		AND files.id = initiative_field_value.value::integer;
$$ LANGUAGE sql STABLE;
