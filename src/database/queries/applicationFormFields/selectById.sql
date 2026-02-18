SELECT application_form_field_to_json(application_form_fields.*) AS object
FROM application_form_fields
	INNER JOIN application_forms
		ON application_form_fields.application_form_id = application_forms.id
WHERE
	application_form_fields.id = :applicationFormFieldId
	AND has_opportunity_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		application_forms.opportunity_id,
		'view',
		'opportunity'
	);
