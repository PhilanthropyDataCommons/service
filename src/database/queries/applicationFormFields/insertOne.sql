INSERT INTO application_form_fields (
  application_form_id,
  canonical_field_short_code,
  position,
  label
) VALUES (
  :applicationFormId,
  :canonicalFieldShortCode,
  :position,
  :label
)
RETURNING
  id as "id",
  application_form_id as "applicationFormId",
  canonical_field_short_code as "canonicalFieldShortCode",
  position as "position",
  label as "label",
  created_at as "createdAt"
