SELECT
	build_changemaker_field_value_result(
		changemaker_field_values,
		:authContextId,
		:authContextIsAdministrator
	) AS object
FROM changemaker_field_values
WHERE
	changemaker_field_values.id = :fieldValueId
	AND changemaker_field_values.id IN (
		SELECT permitted_field_values.id
		FROM permitted_changemaker_field_value_ids_among(
			:authContextId,
			:authContextIsAdministrator,
			'view',
			'changemakerFieldValue',
			ARRAY[:fieldValueId::integer]
		) AS permitted_field_values
	);
