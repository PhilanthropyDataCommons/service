UPDATE base_field_localizations SET
  label = :label,
  description = :description
WHERE base_field_id = :baseFieldId AND language = :language
RETURNING base_field_localization_to_json(base_field_localizations) AS "object";
