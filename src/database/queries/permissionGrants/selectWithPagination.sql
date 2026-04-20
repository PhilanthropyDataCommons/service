WITH
	candidate_entries AS NOT MATERIALIZED (
		SELECT permission_grants.*
		FROM permission_grants
		WHERE can_manage_permission_grant(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			permission_grants.*::permission_grants
		)
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT
			permission_grant_to_json(
				candidate_entries.*::permission_grants
			) AS object
		FROM candidate_entries
		ORDER BY id DESC
		LIMIT :limit OFFSET :offset
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
