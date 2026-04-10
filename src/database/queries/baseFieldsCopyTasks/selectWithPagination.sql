WITH
	candidate_entries AS NOT MATERIALIZED (
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

	paginated_entries AS (
		SELECT
			base_fields_copy_task_to_json(
				candidate_entries.*::base_fields_copy_tasks
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
