SELECT user_to_json(users.*) AS object
FROM users
WHERE keycloak_user_id = :keycloakUserId::uuid;
