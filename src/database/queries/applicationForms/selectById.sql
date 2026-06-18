SELECT application_form_to_json(application_forms.*) AS object
FROM application_forms
	INNER JOIN
		permitted_application_form_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'view',
			'applicationForm'
		) AS permitted_application_forms
		ON application_forms.id = permitted_application_forms.id
WHERE application_forms.id = :applicationFormId;
