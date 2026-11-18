WITH
	inserted_task AS (
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
			auth_context_user_keycloak_user_id(:authContextId)
		)
		RETURNING *
	),

	task_auth_context AS (
		INSERT INTO ephemeral_auth_contexts (
			token_id,
			user_keycloak_user_id,
			not_after
		)
		SELECT
			bulk_upload_task_token_id(inserted_task.id) AS token_id,
			inserted_task.created_by,
			now() + interval '1 day' AS not_after
		FROM inserted_task
		RETURNING token_id
	),

	task_auth_context_organizations AS (
		INSERT INTO ephemeral_auth_context_organizations (
			auth_context_id,
			keycloak_organization_id
		)
		SELECT
			task_auth_context.token_id,
			creator_organization.keycloak_organization_id
		FROM task_auth_context
			CROSS JOIN ephemeral_auth_context_organizations AS creator_organization
		WHERE creator_organization.auth_context_id = :authContextId
	)

SELECT
	bulk_upload_task_to_json(
		inserted_task::bulk_upload_tasks,
		:authContextId,
		:authContextIsAdministrator
	) AS object
FROM inserted_task;
