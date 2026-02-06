SELECT
	bulk_upload_task_to_json(
		bulk_upload_tasks.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM bulk_upload_tasks
	INNER JOIN application_forms
		ON bulk_upload_tasks.application_form_id = application_forms.id
	INNER JOIN opportunities
		ON application_forms.opportunity_id = opportunities.id
WHERE
	CASE
		WHEN :createdBy::uuid IS NULL THEN
			TRUE
		ELSE
			bulk_upload_tasks.created_by = :createdBy
	END
	AND has_funder_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		opportunities.funder_short_code,
		'view',
		'funder'
	)
ORDER BY bulk_upload_tasks.id DESC
LIMIT :limit OFFSET :offset;
