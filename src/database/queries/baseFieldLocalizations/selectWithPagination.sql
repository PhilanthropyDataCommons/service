SELECT base_field_localization_to_json(base_field_localizations) AS object
FROM base_field_localizations
WHERE
	CASE
		WHEN :baseFieldShortCode::varchar IS NULL THEN
			TRUE
		ELSE
			base_field_short_code = :baseFieldShortCode
	END
ORDER BY created_at
LIMIT :limit OFFSET :offset;
