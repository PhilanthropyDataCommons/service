SELECT
  cf.id as "id",
  cf.label as "label",
  cf.short_code as "shortCode",
  cf.data_type as "dataType",
  cf.created_at as "createdAt"
FROM canonical_fields as cf;
