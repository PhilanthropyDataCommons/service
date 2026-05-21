WITH
	candidate_entries AS NOT MATERIALIZED (
		SELECT terminology_sets.*
		FROM terminology_sets
		WHERE
			has_terminology_set_permission(
				:authContextKeycloakUserId,
				:authContextIsAdministrator,
				terminology_sets.id,
				'view',
				'terminologySet'
			)
			AND CASE
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
