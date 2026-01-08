ALTER TABLE changemaker_field_value_batches
ADD COLUMN created_by uuid NOT NULL
DEFAULT system_keycloak_user_id()
REFERENCES users (keycloak_user_id)
ON DELETE CASCADE;

ALTER TABLE changemaker_field_value_batches
ALTER COLUMN created_by DROP DEFAULT;

CREATE INDEX idx_changemaker_field_value_batches_created_by
ON changemaker_field_value_batches (created_by);
