CREATE TABLE files (
	uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	mime_type text NOT NULL,
	size integer NOT NULL CHECK (size >= 0),
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id)
	ON DELETE CASCADE,
	created_at timestamp with time zone NOT NULL DEFAULT now()
);

SELECT audit_table('files');
