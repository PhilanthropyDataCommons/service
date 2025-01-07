CREATE TABLE base_fields_copy_tasks (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	status task_status NOT NULL,
	pdc_api_url varchar NOT NULL,
	status_updated_at timestamp with time zone NOT NULL DEFAULT now(),
	FOREIGN KEY (created_by) REFERENCES users (keycloak_user_id),
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	created_by uuid NOT NULL DEFAULT system_keycloak_user_id()
);

COMMENT ON TABLE base_fields_copy_tasks IS
'An entity representing a basefield copy graphile task'
'from a remote pdc instance to a local instance.';

CREATE OR REPLACE FUNCTION update_status_timestamp()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_status_updated_at
BEFORE UPDATE ON base_fields_copy_tasks
FOR EACH ROW
EXECUTE FUNCTION update_status_timestamp();
