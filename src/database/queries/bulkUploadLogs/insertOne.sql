INSERT INTO bulk_upload_logs (
	bulk_upload_task_id,
	is_error,
	details
)
VALUES (
	:bulkUploadTaskId,
	:isError,
	:details
)
RETURNING bulk_upload_log_to_json(bulk_upload_logs) AS object;
