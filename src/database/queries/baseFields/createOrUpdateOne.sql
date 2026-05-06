MERGE INTO base_fields
USING (VALUES (
	:label::varchar,
	:description::varchar,
	:shortCode::varchar,
	:dataType::field_type,
	:category::base_field_category,
	:valueRelevanceHours::integer,
	:sensitivityClassification::sensitivity_classification
)) AS source (
	label,
	description,
	short_code,
	data_type,
	category,
	value_relevance_hours,
	sensitivity_classification
)
ON base_fields.short_code = source.short_code
WHEN MATCHED THEN UPDATE SET
	label = source.label,
	description = source.description,
	data_type = source.data_type,
	category = source.category,
	value_relevance_hours = source.value_relevance_hours,
	sensitivity_classification = source.sensitivity_classification
WHEN NOT MATCHED THEN INSERT (
	label,
	description,
	short_code,
	data_type,
	category,
	value_relevance_hours,
	sensitivity_classification
) VALUES (
	source.label,
	source.description,
	source.short_code,
	source.data_type,
	source.category,
	source.value_relevance_hours,
	source.sensitivity_classification
)
RETURNING
	base_field_to_json(base_fields) AS object,
	merge_action() = 'INSERT' AS "wasInserted";
