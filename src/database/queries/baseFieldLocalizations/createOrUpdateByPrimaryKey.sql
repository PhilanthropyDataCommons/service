MERGE INTO base_field_localizations
USING (VALUES (
	:baseFieldShortCode::varchar,
	:language::varchar,
	:label::varchar,
	:description::varchar
)) AS source (
	base_field_short_code,
	language,
	label,
	description
)
ON
	base_field_localizations.base_field_short_code = source.base_field_short_code
	AND base_field_localizations.language = source.language
WHEN MATCHED THEN UPDATE SET
	label = source.label,
	description = source.description
WHEN NOT MATCHED THEN INSERT (
	base_field_short_code,
	language,
	label,
	description
) VALUES (
	source.base_field_short_code,
	source.language,
	source.label,
	source.description
)
RETURNING
	base_field_localization_to_json(base_field_localizations) AS object,
	merge_action() = 'INSERT' AS "wasInserted";
