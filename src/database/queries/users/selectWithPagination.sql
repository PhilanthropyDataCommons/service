WITH
	candidate_entries AS MATERIALIZED (
		SELECT users.*
		FROM users
		WHERE
			CASE
				WHEN :keycloakUserId::uuid IS NULL THEN
					TRUE
				ELSE
					users.keycloak_user_id = :keycloakUserId
			END
			AND CASE
				WHEN :authContextKeycloakUserId::uuid IS NULL THEN
					TRUE
				ELSE
					(
						users.keycloak_user_id = :authContextKeycloakUserId
						OR :authContextIsAdministrator::boolean
					)
			END
		GROUP BY users.keycloak_user_id
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
		SELECT
			user_to_json(
				page.*::users,
				:authContextKeycloakUserId,
				:authContextIsAdministrator
			) AS object
		FROM page
		ORDER BY created_at DESC
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
