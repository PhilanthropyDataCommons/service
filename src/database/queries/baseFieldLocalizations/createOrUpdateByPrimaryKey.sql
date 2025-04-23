INSERT INTO base_field_localizations (
	base_field_id,
	language,
	label,
	description
) VALUES (
	:baseFieldId,
	:language,
	:label,
	:description
)
ON CONFLICT (base_field_id, language)
DO UPDATE
	SET
		label = excluded.label,
		description = excluded.description
RETURNING base_field_localization_to_json(base_field_localizations) AS object;
