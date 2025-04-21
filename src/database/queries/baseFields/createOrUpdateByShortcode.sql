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
ON CONFLICT (short_code)
DO UPDATE SET
label = excluded.label,
description = excluded.description,
data_type = excluded.data_type,
scope = excluded.scope,
value_relevance_hours = excluded.value_relevance_hours
RETURNING base_field_to_json(base_fields) AS object;
