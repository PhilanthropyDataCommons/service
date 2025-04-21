INSERT INTO ephemeral_user_group_associations (
	user_keycloak_user_id,
	user_group_keycloak_organization_id,
	not_after
) VALUES (
	:userKeycloakUserId,
	:userGroupKeycloakOrganizationId,
	:notAfter
)
ON CONFLICT (
	user_keycloak_user_id, user_group_keycloak_organization_id
) DO UPDATE
	SET not_after = :notAfter
RETURNING
	ephemeral_user_group_association_to_json(
		ephemeral_user_group_associations
	) AS object;
