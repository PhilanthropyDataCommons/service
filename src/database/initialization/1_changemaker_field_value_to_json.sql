SELECT drop_function('changemaker_field_value_to_json');

CREATE FUNCTION changemaker_field_value_to_json(
	changemaker_field_value changemaker_field_values,
	base_field jsonb,
	batch jsonb,
	file jsonb
) RETURNS jsonb AS $$
	SELECT jsonb_build_object(
		'id', changemaker_field_value.id,
		'changemakerId', changemaker_field_value.changemaker_id,
		'baseFieldShortCode', changemaker_field_value.base_field_short_code,
		'baseField', base_field,
		'batchId', changemaker_field_value.batch_id,
		'batch', batch,
		'value', changemaker_field_value.value,
		'file', file,
		'goodAsOf', changemaker_field_value.good_as_of,
		'isValid', changemaker_field_value.is_valid,
		'createdAt', changemaker_field_value.created_at
	);
$$ LANGUAGE sql IMMUTABLE;
