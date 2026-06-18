SELECT drop_function('ephemeral_user_group_association_to_json');

CREATE FUNCTION ephemeral_user_group_association_to_json(
	ephemeral_user_group_association ephemeral_user_group_associations
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'userKeycloakUserId', ephemeral_user_group_association.user_keycloak_user_id,
    'userGroupKeycloakOrganizationId', ephemeral_user_group_association.user_group_keycloak_organization_id,
    'createdAt', ephemeral_user_group_association.created_at,
		'notAfter', ephemeral_user_group_association.not_after
  );
END;
$$ LANGUAGE plpgsql;
