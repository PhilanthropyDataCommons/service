SELECT application_form_field_to_json(application_form_fields) AS "object"
FROM application_form_fields
WHERE id = :id;
