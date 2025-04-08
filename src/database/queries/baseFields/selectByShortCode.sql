SELECT base_field_to_json(base_fields.*) AS object
FROM base_fields
WHERE short_code = :shortCode;
