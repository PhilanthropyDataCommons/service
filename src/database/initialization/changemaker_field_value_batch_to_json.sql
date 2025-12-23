SELECT drop_function('changemaker_field_value_batch_to_json');

CREATE FUNCTION changemaker_field_value_batch_to_json(
	changemaker_field_value_batch changemaker_field_value_batches
)
RETURNS jsonb AS $$
DECLARE
	source_json JSONB;
BEGIN
	SELECT source_to_json(sources.*)
	INTO source_json
	FROM sources
	WHERE sources.id = changemaker_field_value_batch.source_id;

	RETURN jsonb_build_object(
		'id', changemaker_field_value_batch.id,
		'sourceId', changemaker_field_value_batch.source_id,
		'source', source_json,
		'notes', changemaker_field_value_batch.notes,
		'createdAt', to_json(changemaker_field_value_batch.created_at)#>>'{}'
	);
END;
$$ LANGUAGE plpgsql;
