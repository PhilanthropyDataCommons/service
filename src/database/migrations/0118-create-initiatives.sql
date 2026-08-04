CREATE TABLE initiatives (
	id int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	changemaker_id int NOT NULL REFERENCES changemakers (id) ON DELETE CASCADE,
	title text NOT NULL,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id) ON DELETE CASCADE
);

COMMENT ON TABLE initiatives IS
'Projects or programs led by a changemaker.';

CREATE INDEX idx_initiatives_changemaker
ON initiatives (changemaker_id);

SELECT audit_table('initiatives');
