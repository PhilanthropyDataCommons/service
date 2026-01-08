SELECT changemaker_field_value_to_json(changemaker_field_values.*) AS object
FROM changemaker_field_values
WHERE
	id = :fieldValueId
	AND has_changemaker_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		changemaker_id,
		'view'
	);
