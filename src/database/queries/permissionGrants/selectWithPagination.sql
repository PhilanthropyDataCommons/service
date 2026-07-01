WITH
	candidate_entries AS MATERIALIZED (
		SELECT permission_grants.*
		FROM permission_grants
			INNER JOIN
				permitted_permission_grant_ids(
					:authContextKeycloakUserId,
					:authContextIsAdministrator
				) AS permitted_grants
				ON permission_grants.id = permitted_grants.id
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
			permission_grant_to_json(
				page.*::permission_grants
			) AS object
		FROM page
		ORDER BY id DESC
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
