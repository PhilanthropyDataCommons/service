INSERT INTO base_field_localizations (
	base_field_short_code,
	language,
	label,
	description
) VALUES (
	:baseFieldShortCode,
	:language,
	:label,
	:description
)
ON CONFLICT (base_field_short_code, language)
DO UPDATE
	SET
		label = excluded.label,
		description = excluded.description
RETURNING base_field_localization_to_json(base_field_localizations) AS object;
