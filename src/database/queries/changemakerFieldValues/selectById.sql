SELECT build_changemaker_field_value_result(changemaker_field_values) AS object
FROM changemaker_field_values
WHERE
	changemaker_field_values.id = :fieldValueId
	AND changemaker_field_values.id IN (
		SELECT permitted_field_values.id
		FROM permitted_changemaker_field_value_ids_among(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'view',
			'changemakerFieldValue',
			ARRAY[:fieldValueId::integer]
		) AS permitted_field_values
	);
