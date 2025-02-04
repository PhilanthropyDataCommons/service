SELECT drop_function('user_group_changemaker_permission_to_json');

CREATE FUNCTION user_group_changemaker_permission_to_json(
	user_group_changemaker_permission user_group_changemaker_permissions
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'keycloakOrganizationId', user_group_changemaker_permission.keycloak_organization_id,
    'changemakerId', user_group_changemaker_permission.changemaker_id,
    'permission', user_group_changemaker_permission.permission,
    'createdBy', user_group_changemaker_permission.created_by,
    'createdAt', user_group_changemaker_permission.created_at
  );
END;
$$ LANGUAGE plpgsql;
