INSERT INTO users (
  keycloak_user_id
)
VALUES (
  :keycloakUserId
)
RETURNING user_to_json(users) AS object;
