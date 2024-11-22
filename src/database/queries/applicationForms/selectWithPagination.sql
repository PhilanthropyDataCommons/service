SELECT application_form_to_json(application_forms) AS object
FROM application_forms
ORDER BY id
LIMIT :limit
OFFSET :offset
