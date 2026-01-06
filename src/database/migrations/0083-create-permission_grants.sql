CREATE TYPE permission_grant_grantee_type_t AS ENUM (
	'user',
	'userGroup'
);

CREATE TYPE permission_grant_entity_type_t AS ENUM (
	'funder',
	'changemaker',
	'dataProvider',
	'opportunity',
	'proposal',
	'proposalVersion',
	'applicationForm',
	'applicationFormField',
	'proposalFieldValue',
	'source',
	'bulkUpload',
	'changemakerFieldValue'
);

CREATE TYPE permission_grant_verb_t AS ENUM (
	'view',
	'create',
	'edit',
	'delete',
	'manage'
);

CREATE TABLE permission_grants (
	id int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	grantee_type permission_grant_grantee_type_t NOT NULL,
	grantee_user_keycloak_user_id
	uuid REFERENCES users (keycloak_user_id) ON DELETE CASCADE,
	grantee_keycloak_organization_id uuid,
	context_entity_type permission_grant_entity_type_t NOT NULL,
	changemaker_id
	integer REFERENCES changemakers (id) ON DELETE CASCADE,
	funder_short_code
	text REFERENCES funders (short_code) ON DELETE CASCADE,
	data_provider_short_code
	text REFERENCES data_providers (short_code) ON DELETE CASCADE,
	opportunity_id
	integer REFERENCES opportunities (id) ON DELETE CASCADE,
	proposal_id
	integer REFERENCES proposals (id) ON DELETE CASCADE,
	proposal_version_id
	integer REFERENCES proposal_versions (id) ON DELETE CASCADE,
	application_form_id
	integer REFERENCES application_forms (id) ON DELETE CASCADE,
	application_form_field_id
	integer REFERENCES application_form_fields (id) ON DELETE CASCADE,
	proposal_field_value_id
	integer REFERENCES proposal_field_values (id) ON DELETE CASCADE,
	source_id
	integer REFERENCES sources (id) ON DELETE CASCADE,
	bulk_upload_task_id
	integer REFERENCES bulk_upload_tasks (id) ON DELETE CASCADE,
	changemaker_field_value_id
	integer REFERENCES changemaker_field_values (id) ON DELETE CASCADE,
	scope permission_grant_entity_type_t [] NOT NULL,
	verbs permission_grant_verb_t [] NOT NULL,
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id) ON DELETE CASCADE,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	CONSTRAINT scope_not_empty CHECK (array_length(scope, 1) > 0),
	CONSTRAINT verbs_not_empty CHECK (array_length(verbs, 1) > 0),
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

-- Add a CHECK constraint for a permission_grants FK column ensuring
-- the column is NOT NULL if and only if context_entity_type matches.
CREATE FUNCTION add_permission_grant_fk_constraint_for_context_entity_type(
	entity_type text,
	column_name text
) RETURNS void AS $$
BEGIN
	EXECUTE format(
		'ALTER TABLE permission_grants '
		|| 'ADD CONSTRAINT %I CHECK ('
		|| '(context_entity_type = %L AND %I IS NOT NULL) '
		|| 'OR (context_entity_type != %L AND %I IS NULL))',
		'chk_' || column_name,
		entity_type,
		column_name,
		entity_type,
		column_name
	);
END;
$$ LANGUAGE plpgsql;

SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'changemaker', 'changemaker_id'
);
SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'funder', 'funder_short_code'
);
SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'dataProvider', 'data_provider_short_code'
);
SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'opportunity', 'opportunity_id'
);
SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'proposal', 'proposal_id'
);
SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'proposalVersion', 'proposal_version_id'
);
SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'applicationForm', 'application_form_id'
);
SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'applicationFormField', 'application_form_field_id'
);
SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'proposalFieldValue', 'proposal_field_value_id'
);
SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'source', 'source_id'
);
SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'bulkUpload', 'bulk_upload_task_id'
);
SELECT add_permission_grant_fk_constraint_for_context_entity_type(
	'changemakerFieldValue', 'changemaker_field_value_id'
);

CREATE INDEX permission_grants_grantee_user_idx
ON permission_grants (grantee_user_keycloak_user_id)
WHERE grantee_user_keycloak_user_id IS NOT NULL;

CREATE INDEX permission_grants_grantee_org_idx
ON permission_grants (grantee_keycloak_organization_id)
WHERE grantee_keycloak_organization_id IS NOT NULL;

SELECT audit_table('permission_grants');
