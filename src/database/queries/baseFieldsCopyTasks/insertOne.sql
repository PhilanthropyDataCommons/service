INSERT INTO base_fields_copy_tasks (
	status,
	pdc_api_url,
	created_by
)
VALUES (
	:status,
	:pdcApiUrl,
	:authContextKeycloakUserId
)
RETURNING base_fields_copy_task_to_json(base_fields_copy_tasks) AS object;
