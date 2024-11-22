SELECT user_to_json(users.*) AS object
FROM users
WHERE keycloak_user_id = system_keycloak_user_id()
