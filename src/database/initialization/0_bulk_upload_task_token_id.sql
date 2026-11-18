SELECT drop_function('bulk_upload_task_token_id');

-- Returns the token id of the auth context a bulk upload task runs under.
CREATE FUNCTION bulk_upload_task_token_id(
	bulk_upload_task_id integer
) RETURNS text AS $$
	SELECT 'bulkUploadTask:' || bulk_upload_task_id;
$$ LANGUAGE sql IMMUTABLE;
