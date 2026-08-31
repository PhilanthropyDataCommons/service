WITH
	entry_count AS (
		SELECT count(*) AS total FROM default_permission_grants
	),

	page AS (
		SELECT default_permission_grants.*
		FROM default_permission_grants
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
