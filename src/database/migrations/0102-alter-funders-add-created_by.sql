ALTER TABLE funders
ADD COLUMN created_by uuid NOT NULL
DEFAULT system_keycloak_user_id()
REFERENCES users (keycloak_user_id)
ON DELETE CASCADE;

ALTER TABLE funders
ALTER COLUMN created_by DROP DEFAULT;
