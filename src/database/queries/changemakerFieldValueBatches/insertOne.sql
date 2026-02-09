INSERT INTO changemaker_field_value_batches (
	source_id,
	notes,
	created_by
) VALUES (
	:sourceId,
	:notes,
	:authContextKeycloakUserId
)
RETURNING changemaker_field_value_batch_to_json(
	changemaker_field_value_batches,
	:authContextKeycloakUserId,
	:authContextIsAdministrator
) AS object;
