CREATE TYPE opportunity_permission_t AS ENUM (
	'manage',
	'edit',
	'view',
	'create_proposal'
);

CREATE TABLE user_opportunity_permissions (
	user_keycloak_user_id uuid NOT NULL REFERENCES users (
		keycloak_user_id
	) ON DELETE CASCADE,
	opportunity_permission opportunity_permission_t NOT NULL,
	opportunity_id int NOT NULL REFERENCES opportunities (id) ON DELETE CASCADE,
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id) ON DELETE CASCADE,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	not_after timestamp with time zone DEFAULT NULL,
	PRIMARY KEY (user_keycloak_user_id, opportunity_id, opportunity_permission)
);

CREATE TABLE user_group_opportunity_permissions (
	keycloak_organization_id uuid NOT NULL,
	opportunity_id int NOT NULL REFERENCES opportunities (id) ON DELETE CASCADE,
	opportunity_permission opportunity_permission_t NOT NULL,
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id) ON DELETE CASCADE,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	not_after timestamp with time zone DEFAULT NULL,
	PRIMARY KEY (keycloak_organization_id, opportunity_id, opportunity_permission)
);

SELECT audit_table('user_opportunity_permissions');
SELECT audit_table('user_group_opportunity_permissions');
