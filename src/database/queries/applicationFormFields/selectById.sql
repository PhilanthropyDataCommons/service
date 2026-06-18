SELECT application_form_field_to_json(application_form_fields.*) AS object
FROM application_form_fields
	INNER JOIN
		permitted_application_form_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'view',
			'applicationForm'
		) AS permitted_application_forms
		ON
			application_form_fields.application_form_id = permitted_application_forms.id
WHERE application_form_fields.id = :applicationFormFieldId;
