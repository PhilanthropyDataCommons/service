INSERT INTO base_fields (
	label,
	description,
	short_code,
	data_type,
	scope,
	value_relevance_hours
)
VALUES (
	:label,
	:description,
	:shortCode,
	:dataType,
	:scope,
	:valueRelevanceHours
)
RETURNING base_field_to_json(base_fields) AS object;
