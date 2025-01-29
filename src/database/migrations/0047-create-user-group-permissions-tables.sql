CREATE TABLE user_group_changemaker_permissions (
	keycloak_organization_id uuid NOT NULL,
	permission permission_t NOT NULL,
	changemaker_id int NOT NULL REFERENCES changemakers (id) ON DELETE CASCADE,
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id) ON DELETE CASCADE,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	not_after timestamp with time zone DEFAULT NULL,
	PRIMARY KEY (keycloak_organization_id, permission, changemaker_id)
);

CREATE TABLE user_group_funder_permissions (
	keycloak_organization_id uuid NOT NULL,
	permission permission_t NOT NULL,
	funder_short_code short_code_t NOT NULL REFERENCES funders (
		short_code
	) ON DELETE CASCADE,
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id) ON DELETE CASCADE,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	not_after timestamp with time zone DEFAULT NULL,
	PRIMARY KEY (keycloak_organization_id, permission, funder_short_code)
);

CREATE TABLE user_group_data_provider_permissions (
	keycloak_organization_id uuid NOT NULL,
	permission permission_t NOT NULL,
	data_provider_short_code short_code_t NOT NULL REFERENCES data_providers (
		short_code
	) ON DELETE CASCADE,
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id) ON DELETE CASCADE,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	not_after timestamp with time zone DEFAULT NULL,
	PRIMARY KEY (keycloak_organization_id, permission, data_provider_short_code)
);
