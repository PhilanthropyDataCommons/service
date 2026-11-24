INSERT INTO changemaker_field_value_batches (
	source_id,
	notes,
	created_by
) VALUES (
	:sourceId,
	:notes,
	auth_context_user_keycloak_user_id(:authContextId)
)
RETURNING changemaker_field_value_batch_to_json(
	changemaker_field_value_batches,
	:authContextId,
	:authContextIsAdministrator
) AS object;
