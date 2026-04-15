ALTER TABLE opportunities
ADD COLUMN created_by uuid NOT NULL
DEFAULT system_keycloak_user_id()
REFERENCES users (keycloak_user_id)
ON DELETE CASCADE;

ALTER TABLE opportunities
ALTER COLUMN created_by DROP DEFAULT;
