CREATE TYPE permission_t AS ENUM (
  'manage',
  'edit',
  'view'
);

CREATE TABLE user_changemaker_permissions (
  user_keycloak_user_id UUID NOT NULL REFERENCES users(keycloak_user_id) ON DELETE CASCADE,
  permission permission_t NOT NULL,
  changemaker_id INT NOT NULL REFERENCES changemakers(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(keycloak_user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_keycloak_user_id, permission, changemaker_id)
);

CREATE TABLE user_funder_permissions (
  user_keycloak_user_id UUID NOT NULL REFERENCES users(keycloak_user_id) ON DELETE CASCADE,
  permission permission_t NOT NULL,
  funder_short_code short_code_t NOT NULL REFERENCES funders(short_code) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(keycloak_user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_keycloak_user_id, permission, funder_short_code)
);

CREATE TABLE user_data_provider_permissions (
  user_keycloak_user_id UUID NOT NULL REFERENCES users(keycloak_user_id) ON DELETE CASCADE,
  permission permission_t NOT NULL,
  data_provider_short_code short_code_t NOT NULL REFERENCES data_providers(short_code) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(keycloak_user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_keycloak_user_id, permission, data_provider_short_code)
);
