SELECT application_form_to_json(application_forms.*) AS object
FROM application_forms
WHERE
	id = :applicationFormId
	AND has_application_form_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		application_forms.id,
		'view',
		'applicationForm'
	);
