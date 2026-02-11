-- Migrate user opportunity permissions to permission_grants
-- Note: create_proposal maps to verb='create' with scope=['proposal']
--       Other permissions use scope=['opportunity']
INSERT INTO permission_grants (
	grantee_type,
	grantee_user_keycloak_user_id,
	context_entity_type,
	opportunity_id,
	scope,
	verbs,
	created_by
)
SELECT
	'user'::permission_grant_grantee_type_t AS grantee_type,
	user_keycloak_user_id,
	'opportunity'::permission_grant_entity_type_t AS context_entity_type,
	opportunity_id,
	CASE opportunity_permission::text
		WHEN 'create_proposal' THEN
			ARRAY['proposal']::permission_grant_entity_type_t []
		ELSE ARRAY['opportunity']::permission_grant_entity_type_t []
	END AS scope,
	ARRAY[
		CASE opportunity_permission::text
			WHEN 'create_proposal' THEN 'create'
			ELSE opportunity_permission::text
		END
	]::permission_grant_verb_t [] AS verbs,
	created_by
FROM user_opportunity_permissions
WHERE NOT is_expired(not_after)
ON CONFLICT DO NOTHING;

-- Migrate user group opportunity permissions to permission_grants
INSERT INTO permission_grants (
	grantee_type,
	grantee_keycloak_organization_id,
	context_entity_type,
	opportunity_id,
	scope,
	verbs,
	created_by
)
SELECT
	'userGroup'::permission_grant_grantee_type_t AS grantee_type,
	keycloak_organization_id,
	'opportunity'::permission_grant_entity_type_t AS context_entity_type,
	opportunity_id,
	CASE opportunity_permission::text
		WHEN 'create_proposal' THEN
			ARRAY['proposal']::permission_grant_entity_type_t []
		ELSE ARRAY['opportunity']::permission_grant_entity_type_t []
	END AS scope,
	ARRAY[
		CASE opportunity_permission::text
			WHEN 'create_proposal' THEN 'create'
			ELSE opportunity_permission::text
		END
	]::permission_grant_verb_t [] AS verbs,
	created_by
FROM user_group_opportunity_permissions
WHERE NOT is_expired(not_after)
ON CONFLICT DO NOTHING;

-- Drop old opportunity permission tables and types + audit triggers
SELECT deaudit_table('user_opportunity_permissions');
SELECT deaudit_table('user_group_opportunity_permissions');
DROP TABLE IF EXISTS user_opportunity_permissions CASCADE;
DROP TABLE IF EXISTS user_group_opportunity_permissions CASCADE;
DROP TYPE IF EXISTS opportunity_permission_t;
