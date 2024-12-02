INSERT INTO user_funder_permissions (
  user_keycloak_user_id,
  permission,
  funder_short_code,
  created_by,
  not_after
) VALUES (
  :userKeycloakUserId,
  :permission::permission_t,
  :funderShortCode,
  :createdBy,
  NULL
)
ON CONFLICT (user_keycloak_user_id, permission, funder_short_code) DO UPDATE
  SET not_after = NULL
RETURNING user_funder_permission_to_json(user_funder_permissions) AS object;
