CREATE TABLE user_sync_tasks (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	status task_status NOT NULL,
	status_updated_at timestamp with time zone NOT NULL DEFAULT now(),
	details jsonb,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	created_by uuid NOT NULL DEFAULT system_keycloak_user_id(),
	FOREIGN KEY (created_by) REFERENCES users (keycloak_user_id)
);

COMMENT ON TABLE user_sync_tasks IS
'An entity representing a user sync graphile task replicating Keycloak users
into the local users cache.';

COMMENT ON COLUMN user_sync_tasks.details IS
'The summary of the completed sync run, written when the task completes.';

-- Passing `details` to the ignored columns list prevents credentials
-- from being included.
SELECT audit_table(
	'user_sync_tasks',
	TRUE,
	TRUE,
	TRUE,
	ARRAY['details']
);
