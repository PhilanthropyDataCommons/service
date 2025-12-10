DELETE FROM changemaker_field_values
WHERE id = :changemakerFieldValueId
RETURNING changemaker_field_value_to_json(changemaker_field_values) AS object;
