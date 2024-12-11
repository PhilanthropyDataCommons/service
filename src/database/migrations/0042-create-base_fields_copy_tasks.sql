CREATE TABLE base_fields_copy_tasks (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  status task_status NOT NULL,
  synchronization_url VARCHAR NOT NULL,
  status_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (created_by) REFERENCES users(keycloak_user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL DEFAULT system_keycloak_user_id()
);

COMMENT ON TABLE base_fields_copy_tasks IS
  'An entity representing a basefield copy graphile task from a remote pdc instance to a local instance.';
