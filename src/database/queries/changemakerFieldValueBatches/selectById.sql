SELECT
	changemaker_field_value_batch_to_json(
		changemaker_field_value_batches.*,
		:authContextId,
		:authContextIsAdministrator
	) AS object
FROM changemaker_field_value_batches
WHERE
	id = :batchId
	AND (
		:authContextIsAdministrator::boolean
		OR created_by = auth_context_user_keycloak_user_id(:authContextId)
	);
