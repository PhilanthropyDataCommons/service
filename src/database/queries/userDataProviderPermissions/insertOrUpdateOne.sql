INSERT INTO user_data_provider_permissions (
  user_keycloak_user_id,
  permission,
  data_provider_short_code,
  created_by
) VALUES (
  :userKeycloakUserId,
  :permission::permission_t,
  :dataProviderShortCode,
  :createdBy
)
ON CONFLICT (user_keycloak_user_id, permission, data_provider_short_code)
DO NOTHING
RETURNING user_data_provider_permission_to_json(user_data_provider_permissions) AS object;
