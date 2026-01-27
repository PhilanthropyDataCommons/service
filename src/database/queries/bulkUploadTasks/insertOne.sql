INSERT INTO bulk_upload_tasks (
	source_id,
	application_form_id,
	proposals_data_file_id,
	attachments_archive_file_id,
	status,
	created_by
)
VALUES (
	:sourceId,
	:applicationFormId,
	:proposalsDataFileId,
	:attachmentsArchiveFileId,
	:status,
	:authContextKeycloakUserId
)
RETURNING
	bulk_upload_task_to_json(
		bulk_upload_tasks,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object;
