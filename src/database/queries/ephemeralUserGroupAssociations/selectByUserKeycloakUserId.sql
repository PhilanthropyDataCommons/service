WITH
	candidate_entries AS NOT MATERIALIZED (
		SELECT ephemeral_user_group_associations.*
		FROM ephemeral_user_group_associations
		WHERE
			ephemeral_user_group_associations.user_keycloak_user_id
			= :userKeycloakUserId::uuid
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	)

SELECT
	entry_count.total,
	ephemeral_user_group_association_to_json(
		candidate_entries.*::ephemeral_user_group_associations
	) AS object
FROM entry_count
	LEFT JOIN candidate_entries ON TRUE;
