SELECT
	changemaker_field_value_batch_to_json(
		changemaker_field_value_batches.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM changemaker_field_value_batches
WHERE
	id = :batchId
	AND (
		:authContextIsAdministrator::boolean
		OR created_by = :authContextKeycloakUserId
	);
