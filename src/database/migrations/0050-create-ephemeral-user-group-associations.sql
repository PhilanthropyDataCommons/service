CREATE TABLE ephemeral_user_group_associations (
	user_keycloak_user_id uuid NOT NULL REFERENCES users(keycloak_user_id) ON DELETE CASCADE,
  user_group_keycloak_organization_id uuid NOT NULL,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	PRIMARY KEY (keycloak_user_id, keycloak_organization_id)
);
