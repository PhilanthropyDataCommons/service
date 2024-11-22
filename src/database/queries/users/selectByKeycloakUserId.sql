SELECT user_to_json(users.*) as object
FROM users
WHERE keycloak_user_id = :keycloakUserId::uuid
