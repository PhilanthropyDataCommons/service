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
    WHEN :userId::integer IS NULL THEN
      true
    ELSE
      (
        id = :userId
        OR :isAdministrator::boolean
      )
    END
GROUP BY id
ORDER BY id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY;
