SELECT drop_function('build_changemaker_field_value_result');

-- Gathers a single changemaker field value's children (base field, batch, file)
-- and assembles the result with the changemaker_field_value_to_json shape.
-- Guards against forbidden fields, since callers may serialize a row that has
-- not been permission-filtered (the field value insert).
CREATE FUNCTION build_changemaker_field_value_result(
	changemaker_field_value changemaker_field_values,
	auth_context_keycloak_user_id uuid DEFAULT NULL,
	auth_context_is_administrator boolean DEFAULT FALSE
) RETURNS jsonb AS $$
DECLARE
	is_file_field BOOLEAN;
	base_field_json JSONB;
	batch_json JSONB;
BEGIN
	PERFORM assert_changemaker_field_value_not_forbidden(changemaker_field_value);

	SELECT
		base_fields.data_type = 'file',
		base_field_to_json(base_fields.*)
	INTO is_file_field, base_field_json
	FROM base_fields
	WHERE base_fields.short_code = changemaker_field_value.base_field_short_code;

	SELECT changemaker_field_value_batch_to_json(
		changemaker_field_value_batches.*,
		auth_context_keycloak_user_id,
		auth_context_is_administrator
	)
	INTO batch_json
	FROM changemaker_field_value_batches
	WHERE changemaker_field_value_batches.id = changemaker_field_value.batch_id;

	RETURN changemaker_field_value_to_json(
		changemaker_field_value,
		base_field_json,
		batch_json,
		changemaker_field_value_file_to_json(changemaker_field_value, is_file_field)
	);
END;
$$ LANGUAGE plpgsql STABLE;
