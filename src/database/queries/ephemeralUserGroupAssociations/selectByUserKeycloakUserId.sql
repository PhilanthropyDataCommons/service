SELECT
	ephemeral_user_group_association_to_json(
		ephemeral_user_group_associations.*
	) AS object
FROM ephemeral_user_group_associations
WHERE user_keycloak_user_id = :userKeycloakUserId::uuid;
