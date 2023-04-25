SELECT
  id,
  application_form_id as "applicationFormId",
  canonical_field_id as "canonicalFieldId",
  position,
  label,
  created_at as "createdAt"
FROM application_form_fields
WHERE id = ANY(:ids);
