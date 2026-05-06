MERGE INTO ephemeral_user_group_associations
USING (VALUES (
	:userKeycloakUserId::uuid,
	:userGroupKeycloakOrganizationId::uuid,
	:notAfter::timestamptz
)) AS source (
	user_keycloak_user_id,
	user_group_keycloak_organization_id,
	not_after
)
ON
	ephemeral_user_group_associations.user_keycloak_user_id
	= source.user_keycloak_user_id
	AND ephemeral_user_group_associations.user_group_keycloak_organization_id
	= source.user_group_keycloak_organization_id
WHEN MATCHED THEN UPDATE SET
	not_after = source.not_after
WHEN NOT MATCHED THEN INSERT (
	user_keycloak_user_id,
	user_group_keycloak_organization_id,
	not_after
) VALUES (
	source.user_keycloak_user_id,
	source.user_group_keycloak_organization_id,
	source.not_after
)
RETURNING
	ephemeral_user_group_association_to_json(
		ephemeral_user_group_associations
	) AS object,
	merge_action() = 'INSERT' AS "wasInserted";
