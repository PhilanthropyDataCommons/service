INSERT INTO bulk_upload_tasks (
	source_id,
	file_name,
	source_key,
	status,
	created_by
)
VALUES (
	:sourceId,
	:fileName,
	:sourceKey,
	:status,
	:createdBy
)
RETURNING bulk_upload_task_to_json(bulk_upload_tasks) AS object;
