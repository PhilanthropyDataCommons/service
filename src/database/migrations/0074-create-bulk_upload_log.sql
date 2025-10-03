CREATE TABLE bulk_upload_logs (
	bulk_upload_task_id integer NOT NULL REFERENCES bulk_upload_tasks (id),
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	is_error boolean NOT NULL,
	details jsonb NOT NULL
);

CREATE INDEX bulk_upload_task_id_idx ON bulk_upload_logs (bulk_upload_task_id);

SELECT audit_table('bulk_upload_logs');
