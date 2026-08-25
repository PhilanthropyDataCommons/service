SELECT
	build_initiative_field_value_result(
		initiative_field_values.*::initiative_field_values
	) AS object
FROM initiative_field_values
	INNER JOIN
		permitted_initiative_field_value_ids_among(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'view',
			'initiativeFieldValue',
			ARRAY[:initiativeFieldValueId::integer]
		) AS permitted_field_values
		ON initiative_field_values.id = permitted_field_values.id
WHERE initiative_field_values.id = :initiativeFieldValueId;
