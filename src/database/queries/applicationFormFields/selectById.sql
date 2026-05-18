SELECT application_form_field_to_json(application_form_fields.*) AS object
FROM application_form_fields
WHERE
	application_form_fields.id = :applicationFormFieldId
	AND has_application_form_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		application_form_fields.application_form_id,
		'view',
		'applicationForm'
	);
