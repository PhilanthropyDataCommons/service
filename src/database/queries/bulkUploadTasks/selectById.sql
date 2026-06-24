SELECT
	bulk_upload_task_to_json(
		bulk_upload_tasks.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM bulk_upload_tasks
	INNER JOIN application_forms
		ON bulk_upload_tasks.application_form_id = application_forms.id
	INNER JOIN
		permitted_opportunity_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'view',
			'opportunity'
		) AS permitted_opportunities
		ON application_forms.opportunity_id = permitted_opportunities.id
WHERE bulk_upload_tasks.id = :bulkUploadTaskId;
