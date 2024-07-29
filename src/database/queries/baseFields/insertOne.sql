INSERT INTO base_fields (
  short_code,
  data_type,
  scope
)
VALUES (
  :shortCode,
  :dataType,
  :scope
)
RETURNING base_field_to_json(base_fields) AS "object";
