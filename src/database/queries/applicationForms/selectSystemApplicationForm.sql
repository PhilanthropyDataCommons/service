SELECT application_form_to_json(application_forms.*) AS object
FROM application_forms
WHERE id = system_application_form_id();
