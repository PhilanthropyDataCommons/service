SELECT drop_function('user_data_provider_permission_to_json');

CREATE FUNCTION user_data_provider_permission_to_json(
  user_data_provider_permission user_data_provider_permissions
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'userKeycloakUserId', user_data_provider_permission.user_keycloak_user_id,
    'permission', user_data_provider_permission.permission,
    'dataProviderShortCode', user_data_provider_permission.data_provider_short_code,
    'createdBy', user_data_provider_permission.created_by,
    'createdAt', user_data_provider_permission.created_at
  );
END;
$$ LANGUAGE plpgsql;
