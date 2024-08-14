SELECT base_field_localization_to_json(base_field_localizations) AS "object"
FROM base_field_localizations
WHERE
  CASE
    WHEN :baseFieldId != 0 THEN
      base_field_id = :baseFieldId
    ELSE
      true
    END
ORDER BY created_at
LIMIT
  CASE WHEN :limit != 0 THEN
    :limit
  ELSE
    NULL
  END
OFFSET :offset
