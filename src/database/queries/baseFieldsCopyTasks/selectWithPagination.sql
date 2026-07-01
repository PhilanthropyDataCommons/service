WITH
	candidate_entries AS MATERIALIZED (
		SELECT base_fields_copy_tasks.*
		FROM base_fields_copy_tasks
		WHERE
			CASE
				WHEN :createdBy::uuid IS NULL THEN
					TRUE
				ELSE
					base_fields_copy_tasks.created_by = :createdBy
			END
			AND
			CASE
				WHEN :authContextKeycloakUserId::uuid IS NULL THEN
					TRUE
				ELSE
					(
						base_fields_copy_tasks.created_by = :authContextKeycloakUserId
						OR :authContextIsAdministrator::boolean
					)
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
			base_fields_copy_task_to_json(
				page.*::base_fields_copy_tasks
			) AS object
		FROM page
		ORDER BY id DESC
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
