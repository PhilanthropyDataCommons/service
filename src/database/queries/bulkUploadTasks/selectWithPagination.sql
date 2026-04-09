WITH
	candidate_entries AS NOT MATERIALIZED (
		SELECT bulk_upload_tasks.*
		FROM bulk_upload_tasks
			INNER JOIN application_forms
				ON bulk_upload_tasks.application_form_id = application_forms.id
		WHERE
			CASE
				WHEN :createdBy::uuid IS NULL THEN
					TRUE
				ELSE
					bulk_upload_tasks.created_by = :createdBy
			END
			AND has_opportunity_permission(
				:authContextKeycloakUserId,
				:authContextIsAdministrator,
				application_forms.opportunity_id,
				'view',
				'opportunity'
			)
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT
			bulk_upload_task_to_json(
				candidate_entries.*::bulk_upload_tasks,
				:authContextKeycloakUserId,
				:authContextIsAdministrator
			) AS object
		FROM candidate_entries
		ORDER BY id DESC
		LIMIT :limit OFFSET :offset
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
