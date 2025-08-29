CREATE TABLE files (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	name text NOT NULL,
	storage_key uuid UNIQUE DEFAULT gen_random_uuid(),
	mime_type text NOT NULL,
	size integer NOT NULL CHECK (size >= 0),
	bucket_name text NOT NULL,
	bucket_region text NOT NULL,
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id)
	ON DELETE CASCADE,
	created_at timestamp with time zone NOT NULL DEFAULT now()
);

SELECT audit_table('files');
