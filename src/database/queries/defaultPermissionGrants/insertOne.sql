INSERT INTO default_permission_grants (
	grantee_type,
	grantee_user_keycloak_user_id,
	grantee_keycloak_organization_id,
	context_entity_type,
	scope,
	verbs,
	conditions,
	created_by
)
VALUES (
	:granteeType::permission_grant_grantee_type_t,
	:granteeUserKeycloakUserId::uuid,
	:granteeKeycloakOrganizationId::uuid,
	:contextEntityType::permission_grant_entity_type_t,
	:scope::permission_grant_entity_type_t [],
	:verbs::permission_grant_verb_t [],
	:conditions::jsonb,
	:authContextKeycloakUserId::uuid
)
RETURNING default_permission_grant_to_json(
	default_permission_grants
) AS object;
