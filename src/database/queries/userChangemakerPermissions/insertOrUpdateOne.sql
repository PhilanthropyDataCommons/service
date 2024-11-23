INSERT INTO user_changemaker_permissions (
  user_keycloak_user_id,
  permission,
  changemaker_id,
  created_by
) VALUES (
  :userKeycloakUserId,
  :permission::permission_t,
  :changemakerId,
  :createdBy
)
-- We have to do an update in order to return the row,
-- even though this update is pointless
ON CONFLICT (user_keycloak_user_id, permission, changemaker_id) DO UPDATE
  SET user_keycloak_user_id = excluded.user_keycloak_user_id
RETURNING user_changemaker_permission_to_json(user_changemaker_permissions)
  AS object;
