CREATE TABLE user_group_data_provider_permissions (
	keycloak_organization_id uuid NOT NULL,
	data_provider_short_code short_code_t NOT NULL REFERENCES data_providers (
		short_code
	) ON DELETE CASCADE,
	permission permission_t NOT NULL,
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id) ON DELETE CASCADE,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	not_after timestamp with time zone DEFAULT NULL,
	PRIMARY KEY (keycloak_organization_id, data_provider_short_code, permission)
);
