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
into the local users cache. The table is audited at the row level, with the
free-form details column excluded from the audit log. The credentials used
to perform the sync never enter this table; they travel only inside the
graphile worker job payload, which lives outside the audited schema and is
removed once the job completes.';

COMMENT ON COLUMN user_sync_tasks.details IS
'The summary of the completed sync run, written when the task completes.';

-- Audits the table at the row level. `audit_table` performs
-- `deaudit_table` on the target first, so this call is idempotent. The
-- fifth parameter is the ignored-columns list: `details` is excluded, so
-- the audit log never records the free-form payload of a task row.
SELECT audit_table(
	'user_sync_tasks',
	TRUE,
	TRUE,
	TRUE,
	ARRAY['details']
);
