SELECT drop_function('proposal_field_value_file_to_json');

-- The file a proposal field value points at, or null. A field value references
-- a file when its base field is a file field and its value is the file's id;
-- the file is only revealed to the version's own creator.
CREATE FUNCTION proposal_field_value_file_to_json(
	proposal_field_value proposal_field_values,
	is_file_field boolean,
	version_created_by uuid
) RETURNS jsonb AS $$
	SELECT file_to_json(files.*)
	FROM files
	WHERE proposal_field_value_file_to_json.is_file_field
		AND proposal_field_value.value ~ '^[0-9]+$'
		AND files.id = proposal_field_value.value::integer
		AND files.created_by = proposal_field_value_file_to_json.version_created_by;
$$ LANGUAGE sql STABLE;
