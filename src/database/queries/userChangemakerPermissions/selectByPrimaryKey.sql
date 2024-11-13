SELECT user_changemaker_permission_to_json(
  user_changemaker_permissions.*
) AS object
FROM user_changemaker_permissions
WHERE user_keycloak_user_id = :userKeycloakUserId
  AND changemaker_id = :changemakerId
  AND permission = :permission
  AND NOT is_expired(not_after);
