SELECT drop_function('changemaker_field_value_to_json');

CREATE FUNCTION changemaker_field_value_to_json(
	changemaker_field_value changemaker_field_values
)
RETURNS jsonb AS $$
DECLARE
	is_forbidden BOOLEAN;
	base_field_json JSONB;
	batch_json JSONB;
	base_field_data_type TEXT;
	file_json JSONB;
BEGIN
	SELECT EXISTS (
		SELECT 1
		FROM base_fields
		WHERE base_fields.short_code = changemaker_field_value.base_field_short_code
			AND base_fields.sensitivity_classification = 'forbidden'
	) INTO is_forbidden;

	IF is_forbidden THEN
		RAISE EXCEPTION 'Attempt to convert forbidden changemaker_field_value to JSON (%)', changemaker_field_value.id
			USING ERRCODE = '22023'; -- invalid_parameter_value
	END IF;

	SELECT base_field_to_json(base_fields.*)
	INTO base_field_json
	FROM base_fields
	WHERE base_fields.short_code = changemaker_field_value.base_field_short_code;

	SELECT changemaker_field_value_batch_to_json(changemaker_field_value_batches.*)
	INTO batch_json
	FROM changemaker_field_value_batches
	WHERE changemaker_field_value_batches.id = changemaker_field_value.batch_id;

	-- Get the base field data type
	SELECT base_fields.data_type
	INTO base_field_data_type
	FROM base_fields
	WHERE base_fields.short_code = changemaker_field_value.base_field_short_code;

	-- Load file data for file base fields
	IF base_field_data_type = 'file' AND changemaker_field_value.value ~ '^[0-9]+$' THEN
		SELECT file_to_json(files.*)
		INTO file_json
		FROM files
		WHERE files.id = (changemaker_field_value.value)::INTEGER;
	END IF;

	-- Build the JSON object with file property (jsonb_strip_nulls removes the file key if it's null)
	RETURN jsonb_build_object(
		'id', changemaker_field_value.id,
		'changemakerId', changemaker_field_value.changemaker_id,
		'baseFieldShortCode', changemaker_field_value.base_field_short_code,
		'baseField', base_field_json,
		'batchId', changemaker_field_value.batch_id,
		'batch', batch_json,
		'value', changemaker_field_value.value,
		'file', file_json,
		'goodAsOf', changemaker_field_value.good_as_of,
		'isValid', changemaker_field_value.is_valid,
		'createdAt', changemaker_field_value.created_at
	);
END;
$$ LANGUAGE plpgsql;
