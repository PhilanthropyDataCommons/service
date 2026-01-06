INSERT INTO user_permission_grants (
	user_keycloak_user_id,
	permission_verb,
	root_entity_type,
	root_entity_pk,
	entities,
	created_by,
	not_after
) VALUES (
	:userKeycloakUserId,
	:permissionVerb::permission_verb_t,
	:rootEntityType::permission_entity_type_t,
	:rootEntityPk,
	:entities::text [],
	:authContextKeycloakUserId,
	:notAfter
)
ON CONFLICT (
	user_keycloak_user_id, permission_verb, root_entity_type, root_entity_pk
) DO UPDATE
	SET
		entities = excluded.entities,
		not_after = excluded.not_after
RETURNING user_permission_grant_to_json(user_permission_grants) AS object;
