UPDATE base_fields SET
  label = :label,
  description = :description,
  short_code = :shortCode,
  data_type = :dataType,
  scope = :scope
WHERE id = :id
RETURNING base_field_to_json(base_fields) AS object;
