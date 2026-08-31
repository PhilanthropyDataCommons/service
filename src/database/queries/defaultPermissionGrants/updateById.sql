UPDATE default_permission_grants
SET
	grantee_type = :granteeType::permission_grant_grantee_type_t,
	grantee_user_keycloak_user_id = :granteeUserKeycloakUserId::uuid,
	grantee_keycloak_organization_id
	= :granteeKeycloakOrganizationId::uuid,
	context_entity_type = :contextEntityType::permission_grant_entity_type_t,
	scope = :scope::permission_grant_entity_type_t [],
	verbs = :verbs::permission_grant_verb_t [],
	conditions = :conditions::jsonb
WHERE id = :defaultPermissionGrantId
RETURNING default_permission_grant_to_json(
	default_permission_grants
) AS object;
