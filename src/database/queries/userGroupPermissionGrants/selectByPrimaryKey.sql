SELECT
	user_group_permission_grant_to_json(
		user_group_permission_grants.*
	) AS object
FROM user_group_permission_grants
WHERE
	keycloak_organization_id = :keycloakOrganizationId
	AND permission_verb = :permissionVerb::permission_verb_t
	AND root_entity_type = :rootEntityType::permission_entity_type_t
	AND root_entity_pk = :rootEntityPk
	AND NOT is_expired(not_after);
