SELECT drop_function('user_changemaker_permission_to_json');

CREATE FUNCTION user_changemaker_permission_to_json(
	user_changemaker_permission user_changemaker_permissions
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'userKeycloakUserId', user_changemaker_permission.user_keycloak_user_id,
    'permission', user_changemaker_permission.permission,
    'changemakerId', user_changemaker_permission.changemaker_id,
    'createdBy', user_changemaker_permission.created_by,
    'createdAt', user_changemaker_permission.created_at
  );
END;
$$ LANGUAGE plpgsql;
