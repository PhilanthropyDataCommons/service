INSERT INTO base_fields (
	label,
	description,
	short_code,
	data_type,
	category,
	value_relevance_hours,
	sensitivity_classification
)
VALUES (
	:label,
	:description,
	:shortCode,
	:dataType,
	:category,
	:valueRelevanceHours,
	:sensitivityClassification
)
ON CONFLICT (short_code)
DO UPDATE
	SET
		label = excluded.label,
		description = excluded.description,
		data_type = excluded.data_type,
		category = excluded.category,
		value_relevance_hours = excluded.value_relevance_hours,
		sensitivity_classification = excluded.sensitivity_classification
RETURNING base_field_to_json(base_fields) AS object;
