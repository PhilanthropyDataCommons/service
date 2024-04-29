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
RETURNING base_field_to_json(base_fields) AS "object";
