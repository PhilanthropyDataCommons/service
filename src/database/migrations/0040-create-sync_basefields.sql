CREATE TYPE sync_basefields_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'failed',
  'canceled'
);

CREATE TABLE sync_basefields (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  status sync_basefields_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  synchronization_url VARCHAR NOT NULL,
  status_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL DEFAULT system_keycloak_user_id(),
  FOREIGN KEY (created_by) REFERENCES users(keycloak_user_id)
);

COMMENT ON TABLE sync_basefields IS
  'A user request to run a basefield synchronization from a remote pdc instance to a local instance.';
