SELECT application_form_to_json(application_forms.*) AS object
FROM application_forms
	INNER JOIN opportunities ON application_forms.opportunity_id = opportunities.id
WHERE
	application_forms.id = :applicationFormId
	AND has_funder_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		opportunities.funder_short_code,
		'view',
		'funder'
	);
