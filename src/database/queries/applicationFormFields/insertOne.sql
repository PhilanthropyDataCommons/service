INSERT INTO application_form_fields (
  application_form_id,
  base_field_id,
  position,
  label
) VALUES (
  :applicationFormId,
  :baseFieldId,
  :position,
  :label
)
RETURNING
  id as "id",
  application_form_id as "applicationFormId",
  base_field_id as "baseFieldId",
  position as "position",
  label as "label",
  created_at as "createdAt"
