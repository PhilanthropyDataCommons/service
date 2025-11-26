SELECT changemaker_field_value_to_json(changemaker_field_values.*) AS object
FROM changemaker_field_values
	INNER JOIN changemakers
		ON changemaker_field_values.changemaker_id = changemakers.id
WHERE
	changemaker_field_values.id = :changemakerFieldValueId
	AND has_changemaker_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		changemakers.id,
		'view'
	);
