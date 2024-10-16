INSERT INTO base_fields (
  label,
  description,
  short_code,
  data_type,
  scope
)
VALUES (
  :label,
  :description,
  :shortCode,
  :dataType,
  :scope
)
ON CONFLICT (short_code)
DO UPDATE SET
  label = excluded.label,
  description = excluded.description,
  data_type = excluded.data_type,
  scope = excluded.scope
RETURNING base_field_to_json(base_fields) AS object;
