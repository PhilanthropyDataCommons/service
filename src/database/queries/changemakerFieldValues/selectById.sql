SELECT changemaker_field_value_to_json(changemaker_field_values.*) AS object
FROM changemaker_field_values
	INNER JOIN
		permitted_changemaker_field_value_ids_among(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'view',
			'changemakerFieldValue',
			ARRAY[:fieldValueId::integer]
		) AS permitted_field_values
		ON changemaker_field_values.id = permitted_field_values.id
WHERE changemaker_field_values.id = :fieldValueId;
