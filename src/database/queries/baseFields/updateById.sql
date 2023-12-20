UPDATE base_fields SET
  label = :label,
  description = :description,
  short_code = :shortCode,
  data_type = :dataType
WHERE id = :id
RETURNING
  id,
  label,
  description,
  short_code as "shortCode",
  data_type as "dataType",
  created_at as "createdAt"
