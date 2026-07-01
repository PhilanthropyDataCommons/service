SELECT drop_function('changemaker_field_value_file_to_json');

-- The file a changemaker field value points at, or null. A field value
-- references a file when its base field is a file field and its value is the
-- file's id.
CREATE FUNCTION changemaker_field_value_file_to_json(
	changemaker_field_value changemaker_field_values,
	is_file_field boolean
) RETURNS jsonb AS $$
	SELECT file_to_json(files.*)
	FROM files
	WHERE changemaker_field_value_file_to_json.is_file_field
		AND changemaker_field_value.value ~ '^[0-9]+$'
		AND files.id = changemaker_field_value.value::integer;
$$ LANGUAGE sql STABLE;
