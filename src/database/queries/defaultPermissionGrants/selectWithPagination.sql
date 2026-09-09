WITH
	candidate_entries AS MATERIALIZED (
		SELECT default_permission_grants.*
		FROM default_permission_grants
		WHERE
			CASE
				WHEN :contextEntityType::permission_grant_entity_type_t IS NULL THEN
					TRUE
				ELSE
					default_permission_grants.context_entity_type
					= :contextEntityType
			END
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
			default_permission_grant_to_json(
				page.*::default_permission_grants
			) AS object
		FROM page
		ORDER BY id DESC
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
