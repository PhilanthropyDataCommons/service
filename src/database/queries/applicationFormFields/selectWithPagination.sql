SELECT application_form_field_to_json(application_form_fields) AS "object"
FROM application_form_fields
WHERE
  CASE
    WHEN :applicationFormId != 0 THEN
      application_form_id = :applicationFormId
    ELSE
      true
    END
ORDER BY position, id
LIMIT
  CASE WHEN :limit != 0 THEN
    :limit
  ELSE
    NULL
  END
OFFSET :offset
