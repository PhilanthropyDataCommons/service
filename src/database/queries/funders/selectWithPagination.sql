WITH
	search_query AS (
		SELECT
			CASE
				WHEN (
					:search::text IS NULL
					OR :search = ''
				) THEN
					NULL
				ELSE
					websearch_to_tsquery('english', :search::text)
			END AS tsquery
	),

	candidate_entries AS NOT MATERIALIZED (
		SELECT funders.*
		FROM funders
			CROSS JOIN search_query
		WHERE
			(
				:isCollaborative::boolean IS NULL
				OR funders.is_collaborative = :isCollaborative::boolean
			)
			AND (
				search_query.tsquery IS NULL
				OR funders.name_search @@ search_query.tsquery
				OR EXISTS (
					SELECT 1
					FROM funder_collaborative_members AS fcm
						INNER JOIN funders AS member_f
							ON fcm.member_funder_short_code = member_f.short_code
					WHERE
						fcm.funder_collaborative_short_code = funders.short_code
						AND NOT is_expired(fcm.not_after)
						AND member_f.name_search @@ search_query.tsquery
				)
			)
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT funder_to_json(candidate_entries.*::funders) AS object
		FROM candidate_entries
		ORDER BY created_at DESC
		LIMIT :limit OFFSET :offset
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
