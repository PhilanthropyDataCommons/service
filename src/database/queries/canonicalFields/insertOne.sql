INSERT INTO canonical_fields (
  label,
  short_code,
  data_type
)
VALUES (
  :label,
  :shortCode,
  :dataType
)
RETURNING
  id as "id",
  label as "label",
  short_code as "shortCode",
  data_type as "dataType",
  created_at as "createdAt"
