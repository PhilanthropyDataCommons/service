SELECT drop_function('initiative_field_value_to_json');

CREATE FUNCTION initiative_field_value_to_json(
	initiative_field_value initiative_field_values,
	base_field jsonb,
	source jsonb,
	file jsonb
) RETURNS jsonb AS $$
	SELECT jsonb_build_object(
		'id', initiative_field_value.id,
		'initiativeId', initiative_field_value.initiative_id,
		'baseFieldShortCode', initiative_field_value.base_field_short_code,
		'baseField', base_field,
		'sourceId', initiative_field_value.source_id,
		'source', source,
		'value', initiative_field_value.value,
		'file', file,
		'goodAsOf', initiative_field_value.good_as_of,
		'isValid', initiative_field_value.is_valid,
		'createdAt', initiative_field_value.created_at,
		'createdBy', initiative_field_value.created_by
	);
$$ LANGUAGE sql IMMUTABLE;
