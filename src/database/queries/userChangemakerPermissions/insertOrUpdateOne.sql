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
ON CONFLICT (user_keycloak_user_id, permission, changemaker_id)
DO NOTHING
RETURNING user_changemaker_permission_to_json(user_changemaker_permissions) AS "object";
