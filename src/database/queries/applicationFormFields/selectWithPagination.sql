SELECT
  id as "id",
  application_form_id as "applicationFormId",
  base_field_id as "baseFieldId",
  position as "position",
  label as "label",
  created_at as "createdAt"
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
