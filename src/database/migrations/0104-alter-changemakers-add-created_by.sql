ALTER TABLE changemakers
ADD COLUMN created_by uuid NOT NULL
DEFAULT system_keycloak_user_id()
REFERENCES users (keycloak_user_id)
ON DELETE CASCADE;

ALTER TABLE changemakers
ALTER COLUMN created_by DROP DEFAULT;
