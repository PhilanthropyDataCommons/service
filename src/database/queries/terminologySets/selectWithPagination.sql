WITH
	candidate_entries AS MATERIALIZED (
		SELECT terminology_sets.*
		FROM terminology_sets
			INNER JOIN
				permitted_terminology_set_ids(
					:authContextKeycloakUserId,
					:authContextIsAdministrator,
					'view',
					'terminologySet'
				) AS permitted_terminology_sets
				ON terminology_sets.id = permitted_terminology_sets.id
		WHERE CASE
			WHEN :funderShortCode::short_code_t IS NULL THEN TRUE
			ELSE terminology_sets.funder_short_code = :funderShortCode
		END
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT
			terminology_set_to_json(
				candidate_entries.*::terminology_sets
			) AS object
		FROM candidate_entries
		ORDER BY id
		LIMIT :limit OFFSET :offset
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
