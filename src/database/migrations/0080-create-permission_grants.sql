CREATE TYPE permission_verb_t AS ENUM (
	'view',
	'create',
	'edit',
	'delete',
	'manage'
);

CREATE TYPE permission_entity_type_t AS ENUM (
	'changemaker',
	'funder',
	'dataProvider',
	'opportunity',
	'proposal',
	'proposalVersion',
	'applicationForm',
	'applicationFormField',
	'proposalFieldValue',
	'bulkUpload',
	'source',
	'outcome',
	'baseField',
	'externalFieldValue'
);

CREATE TABLE user_permission_grants (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	user_keycloak_user_id uuid NOT NULL REFERENCES users (
		keycloak_user_id
	) ON DELETE CASCADE,
	permission_verb permission_verb_t NOT NULL,
	root_entity_type permission_entity_type_t NOT NULL,
	root_entity_pk text NOT NULL,
	entities text [] NOT NULL DEFAULT '{}',
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id) ON DELETE CASCADE,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	not_after timestamp with time zone DEFAULT NULL,
	UNIQUE (
		user_keycloak_user_id, permission_verb, root_entity_type, root_entity_pk
	)
);

CREATE TABLE user_group_permission_grants (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	keycloak_organization_id uuid NOT NULL,
	permission_verb permission_verb_t NOT NULL,
	root_entity_type permission_entity_type_t NOT NULL,
	root_entity_pk text NOT NULL,
	entities text [] NOT NULL DEFAULT '{}',
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id) ON DELETE CASCADE,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	not_after timestamp with time zone DEFAULT NULL,
	UNIQUE (
		keycloak_organization_id, permission_verb, root_entity_type, root_entity_pk
	)
);

CREATE INDEX idx_user_permission_grants_user
ON user_permission_grants (user_keycloak_user_id);
CREATE INDEX idx_user_permission_grants_entity
ON user_permission_grants (root_entity_type, root_entity_pk);
CREATE INDEX idx_user_group_permission_grants_org
ON user_group_permission_grants (keycloak_organization_id);
CREATE INDEX idx_user_group_permission_grants_entity
ON user_group_permission_grants (root_entity_type, root_entity_pk);

SELECT audit_table('user_permission_grants');
SELECT audit_table('user_group_permission_grants');
