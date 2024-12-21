SELECT base_field_localization_to_json(base_field_localizations) AS object
FROM base_field_localizations
WHERE
	CASE
		WHEN :baseFieldId::integer IS NULL THEN
			TRUE
		ELSE
			base_field_id = :baseFieldId
	END
ORDER BY created_at
LIMIT :limit OFFSET :offset;
