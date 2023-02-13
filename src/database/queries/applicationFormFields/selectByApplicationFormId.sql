SELECT
  aff.id as "id",
  aff.application_form_id as "applicationFormId",
  aff.canonical_field_id as "canonicalFieldId",
  aff.position as "position",
  aff.label as "label",
  aff.created_at as "createdAt"
FROM application_form_fields aff
WHERE aff.application_form_id = :applicationFormId
ORDER BY aff.position;
