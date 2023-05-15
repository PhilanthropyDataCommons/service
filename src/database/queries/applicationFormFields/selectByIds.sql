SELECT
  id,
  application_form_id as "applicationFormId",
  base_field_id as "baseFieldId",
  position,
  label,
  created_at as "createdAt"
FROM application_form_fields
WHERE id = ANY(:ids);
