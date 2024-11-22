SELECT base_field_to_json(base_fields.*) as object
FROM base_fields
WHERE id = :id;
