SELECT
	user_permission_grant_to_json(
		user_permission_grants.*
	) AS object
FROM user_permission_grants
WHERE
	user_keycloak_user_id = :userKeycloakUserId
	AND permission_verb = :permissionVerb::permission_verb_t
	AND root_entity_type = :rootEntityType::permission_entity_type_t
	AND root_entity_pk = :rootEntityPk
	AND NOT is_expired(not_after);
