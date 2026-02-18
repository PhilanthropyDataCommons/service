SELECT application_form_field_to_json(application_form_fields.*) AS object
FROM application_form_fields
	INNER JOIN application_forms
		ON application_form_fields.application_form_id = application_forms.id
WHERE
	CASE
		WHEN :applicationFormId::integer IS NULL THEN
			TRUE
		ELSE
			application_form_fields.application_form_id = :applicationFormId
	END
	AND has_opportunity_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		application_forms.opportunity_id,
		'view',
		'opportunity'
	)
ORDER BY application_form_fields.position, application_form_fields.id
LIMIT :limit OFFSET :offset;
