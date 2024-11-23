SELECT drop_function('user_funder_permission_to_json');

CREATE FUNCTION user_funder_permission_to_json(
  user_funder_permission user_funder_permissions
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'userKeycloakUserId', user_funder_permission.user_keycloak_user_id,
    'permission', user_funder_permission.permission,
    'funderShortCode', user_funder_permission.funder_short_code,
    'createdBy', user_funder_permission.created_by,
    'createdAt', user_funder_permission.created_at
  );
END;
$$ LANGUAGE plpgsql;
