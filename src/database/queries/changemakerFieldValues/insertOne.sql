INSERT INTO changemaker_field_values (
	changemaker_id,
	base_field_short_code,
	batch_id,
	value,
	is_valid,
	good_as_of
) VALUES (
	:changemakerId,
	:baseFieldShortCode,
	:batchId,
	:value,
	:isValid,
	:goodAsOf
)
RETURNING
	build_changemaker_field_value_result(changemaker_field_values) AS object;
