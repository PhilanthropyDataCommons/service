SELECT user_to_json(users.*) as "object"
FROM users
WHERE
  CASE
    WHEN :keycloakUserId::uuid IS NULL THEN
      true
    ELSE
      keycloak_user_id = :keycloakUserId
    END
  AND CASE
    WHEN :userId::UUID IS NULL THEN
      true
    ELSE
      (
        keycloak_user_id = :userId
        OR :isAdministrator::boolean
      )
    END
GROUP BY keycloak_user_id
ORDER BY created_at DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY;
