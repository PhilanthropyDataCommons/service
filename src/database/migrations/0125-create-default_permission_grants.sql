CREATE TABLE default_permission_grants (
	id int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	grantee_type permission_grant_grantee_type_t NOT NULL,
	grantee_user_keycloak_user_id
	uuid REFERENCES users (keycloak_user_id) ON DELETE CASCADE,
	grantee_keycloak_organization_id uuid,
	context_entity_type permission_grant_entity_type_t NOT NULL,
	scope permission_grant_entity_type_t [] NOT NULL,
	verbs permission_grant_verb_t [] NOT NULL,
	conditions jsonb,
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id) ON DELETE CASCADE,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	CONSTRAINT scope_not_empty CHECK (array_length(scope, 1) > 0),
	CONSTRAINT verbs_not_empty CHECK (array_length(verbs, 1) > 0),
	CONSTRAINT chk_conditions CHECK (
		is_valid_permission_grant_conditions(conditions)
	),
	CONSTRAINT chk_grantee_user_keycloak_user_id CHECK (
		(grantee_type = 'user' AND grantee_user_keycloak_user_id IS NOT NULL)
		OR (grantee_type != 'user' AND grantee_user_keycloak_user_id IS NULL)
	),
	CONSTRAINT chk_grantee_keycloak_organization_id CHECK (
		(
			grantee_type = 'userGroup'
			AND grantee_keycloak_organization_id IS NOT NULL
		)
		OR (
			grantee_type != 'userGroup'
			AND grantee_keycloak_organization_id IS NULL
		)
	)
);

COMMENT ON TABLE default_permission_grants IS
'Permission grant templates keyed by the type of their context entity rather '
'than by a specific entity. A default permission grant combined with a newly '
'created entity of its context_entity_type describes a permission grant.';

SELECT audit_table('default_permission_grants');
