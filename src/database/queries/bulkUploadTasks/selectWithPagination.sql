WITH
	candidate_entries AS MATERIALIZED (
		SELECT bulk_upload_tasks.*
		FROM bulk_upload_tasks
			INNER JOIN application_forms
				ON bulk_upload_tasks.application_form_id = application_forms.id
			INNER JOIN
				permitted_opportunity_ids(
					:authContextKeycloakUserId,
					:authContextIsAdministrator,
					'view',
					'opportunity'
				) AS permitted_opportunities
				ON application_forms.opportunity_id = permitted_opportunities.id
		WHERE
			CASE
				WHEN :createdBy::uuid IS NULL THEN
					TRUE
				ELSE
					bulk_upload_tasks.created_by = :createdBy
			END
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	page AS (
		SELECT candidate_entries.*
		FROM candidate_entries
		ORDER BY id DESC
		LIMIT :limit OFFSET :offset
	),

	paginated_entries AS (
		SELECT
			bulk_upload_task_to_json(
				page.*::bulk_upload_tasks,
				:authContextKeycloakUserId,
				:authContextIsAdministrator
			) AS object
		FROM page
		ORDER BY id DESC
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
