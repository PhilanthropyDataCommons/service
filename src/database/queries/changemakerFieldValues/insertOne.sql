INSERT INTO changemaker_field_values (
	changemaker_id,
	base_field_short_code,
	source_id,
	value,
	is_valid,
	good_as_of
) VALUES (
	:changemakerId,
	:baseFieldShortCode,
	:sourceId,
	:value,
	:isValid,
	:goodAsOf
)
ON CONFLICT (changemaker_id, base_field_short_code, source_id)
DO UPDATE
	SET
		value = excluded.value,
		is_valid = excluded.is_valid,
		good_as_of = excluded.good_as_of
RETURNING changemaker_field_value_to_json(changemaker_field_values) AS object;
