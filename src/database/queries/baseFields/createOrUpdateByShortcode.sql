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
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  data_type = EXCLUDED.data_type,
  scope = EXCLUDED.scope
WHERE EXCLUDED.short_code = :shortCode
RETURNING base_field_to_json(base_fields) AS "object";
