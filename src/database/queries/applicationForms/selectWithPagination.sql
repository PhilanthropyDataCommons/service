SELECT application_form_to_json(application_forms) AS "object"
FROM application_forms
ORDER BY id
LIMIT
  CASE WHEN :limit != 0 THEN
    :limit
  ELSE
    NULL
  END
OFFSET :offset
