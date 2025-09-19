ALTER TABLE users ALTER COLUMN keycloak_user_name DROP NOT NULL;
UPDATE users SET keycloak_user_name = NULL
WHERE keycloak_user_name = 'User who has not recently logged in';
