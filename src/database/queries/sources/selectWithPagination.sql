WITH
	candidate_entries AS MATERIALIZED (
		SELECT sources.*
		FROM sources
			INNER JOIN
				permitted_source_ids(
					:authContextKeycloakUserId,
					:authContextIsAdministrator,
					'view',
					'source'
				) AS permitted_sources
				ON sources.id = permitted_sources.id
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
			source_to_json(
				page.*::sources,
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
