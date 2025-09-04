INSERT INTO bulk_upload_tasks (
	source_id,
	funder_short_code,
	proposals_data_file_id,
	status,
	created_by
)
VALUES (
	:sourceId,
	:funderShortCode,
	:proposalsDataFileId,
	:status,
	:authContextKeycloakUserId
)
RETURNING bulk_upload_task_to_json(bulk_upload_tasks) AS object;
