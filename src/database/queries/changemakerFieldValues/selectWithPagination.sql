SELECT changemaker_field_value_to_json(changemaker_field_values.*) AS object
FROM changemaker_field_values
WHERE
	CASE
		WHEN :batchId::integer IS NULL THEN
			TRUE
		ELSE
			batch_id = :batchId
	END
	AND CASE
		WHEN :changemakerId::integer IS NULL THEN
			TRUE
		ELSE
			changemaker_id = :changemakerId
	END
	AND has_changemaker_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		changemaker_id,
		'view',
		'changemaker'
	)
ORDER BY id DESC
LIMIT :limit OFFSET :offset;
