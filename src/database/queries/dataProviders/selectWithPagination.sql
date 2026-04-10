WITH
	candidate_entries AS NOT MATERIALIZED (
		SELECT data_providers.*
		FROM data_providers
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT data_provider_to_json(candidate_entries.*::data_providers) AS object
		FROM candidate_entries
		ORDER BY created_at DESC
		LIMIT :limit OFFSET :offset
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
