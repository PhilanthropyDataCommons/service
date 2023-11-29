INSERT INTO base_fields (
  label,
  description,
  short_code,
  data_type
)
VALUES (
  :label,
  :description,
  :shortCode,
  :dataType
)
RETURNING
  id as "id",
  label as "label",
  description as "description",
  short_code as "shortCode",
  data_type as "dataType",
  created_at as "createdAt"
