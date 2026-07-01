WITH
	candidate_entries AS MATERIALIZED (
		SELECT data_providers.*
		FROM data_providers
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	page AS (
		SELECT candidate_entries.*
		FROM candidate_entries
		ORDER BY created_at DESC
		LIMIT :limit OFFSET :offset
	),

	paginated_entries AS (
		SELECT data_provider_to_json(page.*::data_providers) AS object
		FROM page
		ORDER BY created_at DESC
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
