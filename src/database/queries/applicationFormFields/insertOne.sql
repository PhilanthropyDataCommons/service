INSERT INTO application_form_fields (
  application_form_id,
  canonical_field_id,
  position,
  label
) VALUES (
  :applicationFormId,
  :canonicalFieldId,
  :position,
  :label
)
RETURNING
  id as "id",
  application_form_id as "applicationFormId",
  canonical_field_id as "canonicalFieldId",
  position as "position",
  label as "label",
  created_at as "createdAt"
