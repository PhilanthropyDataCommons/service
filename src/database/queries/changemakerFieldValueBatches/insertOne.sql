INSERT INTO changemaker_field_value_batches (
	source_id,
	notes
) VALUES (
	:sourceId,
	:notes
)
RETURNING changemaker_field_value_batch_to_json(changemaker_field_value_batches)
	AS object;
