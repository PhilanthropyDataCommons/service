SELECT drop_function('changemaker_field_value_batch_to_json');

CREATE FUNCTION changemaker_field_value_batch_to_json(
	changemaker_field_value_batch changemaker_field_value_batches,
	auth_context_keycloak_user_id uuid DEFAULT NULL,
	auth_context_is_administrator boolean DEFAULT FALSE
)
RETURNS jsonb AS $$
DECLARE
	source_json JSONB;
BEGIN
	SELECT source_to_json(
		sources.*,
		auth_context_keycloak_user_id,
		auth_context_is_administrator
	)
	INTO source_json
	FROM sources
	WHERE sources.id = changemaker_field_value_batch.source_id;

	RETURN jsonb_build_object(
		'id', changemaker_field_value_batch.id,
		'sourceId', changemaker_field_value_batch.source_id,
		'source', source_json,
		'notes', changemaker_field_value_batch.notes,
		'createdBy', changemaker_field_value_batch.created_by,
		'createdAt', to_json(changemaker_field_value_batch.created_at)#>>'{}'
	);
END;
$$ LANGUAGE plpgsql;
