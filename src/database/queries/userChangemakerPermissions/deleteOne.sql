UPDATE user_changemaker_permissions
  SET not_after = now()
  WHERE user_keycloak_user_id = :userKeycloakUserId
  AND permission = :permission::permission_t
  AND changemaker_id = :changemakerId
  AND NOT is_expired(not_after);
