WITH
	candidate_entries AS MATERIALIZED (
		SELECT opportunities.*
		FROM opportunities
			INNER JOIN
				permitted_opportunity_ids(
					:authContextKeycloakUserId,
					:authContextIsAdministrator,
					'view',
					'opportunity'
				) AS permitted_opportunities
				ON opportunities.id = permitted_opportunities.id
		WHERE
			CASE
				WHEN :funderShortCode::short_code_t IS NULL THEN
					TRUE
				ELSE
					opportunities.funder_short_code = :funderShortCode
			END
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
