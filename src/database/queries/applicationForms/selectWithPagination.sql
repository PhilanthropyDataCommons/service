SELECT application_form_to_json(application_forms.*) AS object
FROM application_forms
WHERE
	has_opportunity_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		opportunity_id,
		'view',
		'opportunity'
	)
ORDER BY id
LIMIT :limit OFFSET :offset;
