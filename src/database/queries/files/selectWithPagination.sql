WITH
	candidate_entries AS MATERIALIZED (
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

	page AS (
		SELECT candidate_entries.*
		FROM candidate_entries
		ORDER BY id DESC
		LIMIT :limit OFFSET :offset
	),

	paginated_entries AS (
		SELECT file_to_json(page.*::files) AS object
		FROM page
		ORDER BY id DESC
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
