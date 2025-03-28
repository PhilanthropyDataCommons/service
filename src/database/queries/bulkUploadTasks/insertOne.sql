INSERT INTO bulk_upload_tasks (
	source_id,
	funder_short_code,
	file_name,
	source_key,
	status,
	created_by
)
VALUES (
	:sourceId,
	:funderShortCode,
	:fileName,
	:sourceKey,
	:status,
	:authContextKeycloakUserId
)
RETURNING bulk_upload_task_to_json(bulk_upload_tasks) AS object;
