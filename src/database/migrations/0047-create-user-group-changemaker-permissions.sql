CREATE TABLE user_group_changemaker_permissions (
	keycloak_organization_id uuid NOT NULL,
	changemaker_id int NOT NULL REFERENCES changemakers (id) ON DELETE CASCADE,
	permission permission_t NOT NULL,
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id) ON DELETE CASCADE,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	not_after timestamp with time zone DEFAULT NULL,
	PRIMARY KEY (keycloak_organization_id, changemaker_id, permission)
);
