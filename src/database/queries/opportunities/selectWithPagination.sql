WITH
	candidate_entries AS NOT MATERIALIZED (
		SELECT opportunities.*
		FROM opportunities
		WHERE
			has_opportunity_permission(
				:authContextKeycloakUserId,
				:authContextIsAdministrator,
				opportunities.id,
				'view',
				'opportunity'
			)
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT opportunity_to_json(candidate_entries.*::opportunities) AS object
		FROM candidate_entries
		ORDER BY id
		LIMIT :limit OFFSET :offset
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
