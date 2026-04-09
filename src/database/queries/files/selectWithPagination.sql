WITH
	candidate_entries AS NOT MATERIALIZED (
		SELECT files.*
		FROM files
		WHERE
			CASE
				WHEN :createdBy::uuid IS NULL THEN
					TRUE
				ELSE
					files.created_by = :createdBy
			END
			AND (
				files.created_by = :authContextKeycloakUserId
				OR :authContextIsAdministrator::boolean
			)
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT file_to_json(candidate_entries.*::files) AS object
		FROM candidate_entries
		ORDER BY id DESC
		LIMIT :limit OFFSET :offset
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
