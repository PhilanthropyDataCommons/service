SELECT changemaker_field_value_to_json(changemaker_field_values.*) AS object
FROM changemaker_field_values
WHERE
	id = :fieldValueId
	AND has_changemaker_field_value_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		id,
		'view',
		'changemakerFieldValue'
	);
