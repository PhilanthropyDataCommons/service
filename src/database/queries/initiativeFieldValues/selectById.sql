SELECT
	build_initiative_field_value_result(
		initiative_field_values.*::initiative_field_values
	) AS object
FROM initiative_field_values
	INNER JOIN base_fields
		ON
			initiative_field_values.base_field_short_code
			= base_fields.short_code
WHERE
	initiative_field_values.id = :initiativeFieldValueId
	AND initiative_field_values.initiative_id = :initiativeId
	AND base_fields.sensitivity_classification <> 'forbidden';
