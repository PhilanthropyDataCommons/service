ALTER TABLE users ADD COLUMN keycloak_user_name varchar NOT NULL
DEFAULT 'User who has not recently logged in';
ALTER TABLE users ALTER COLUMN keycloak_user_name DROP DEFAULT;
