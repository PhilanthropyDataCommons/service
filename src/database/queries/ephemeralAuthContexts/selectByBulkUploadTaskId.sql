SELECT ephemeral_auth_context_to_json(ephemeral_auth_contexts.*) AS object
FROM ephemeral_auth_contexts
WHERE token_id = bulk_upload_task_token_id(:bulkUploadTaskId);
