INSERT INTO user_changemaker_permissions (
  user_keycloak_user_id,
  permission,
  changemaker_id,
  created_by,
  not_after
) VALUES (
  :userKeycloakUserId,
  :permission::permission_t,
  :changemakerId,
  :createdBy,
  null
)
ON CONFLICT (user_keycloak_user_id, permission, changemaker_id) DO UPDATE
  SET not_after = null
RETURNING user_changemaker_permission_to_json(user_changemaker_permissions)
  AS object;
