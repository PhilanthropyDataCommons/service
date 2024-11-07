INSERT INTO user_funder_permissions (
  user_keycloak_user_id,
  permission,
  funder_short_code,
  created_by
) VALUES (
  :userKeycloakUserId,
  :permission::permission_t,
  :funderShortCode,
  :createdBy
)
ON CONFLICT (user_keycloak_user_id, permission, funder_short_code)
DO NOTHING
RETURNING user_funder_permission_to_json(user_funder_permissions) AS "object";
