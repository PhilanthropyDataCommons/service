-- Migrate user data provider permissions to permission_grants
INSERT INTO permission_grants (
	grantee_type,
	grantee_user_keycloak_user_id,
	context_entity_type,
	data_provider_short_code,
	scope,
	verbs,
	created_by
)
SELECT
	'user'::permission_grant_grantee_type_t,
	user_keycloak_user_id,
	'dataProvider'::permission_grant_entity_type_t,
	data_provider_short_code,
	ARRAY['dataProvider']::permission_grant_entity_type_t [],
	ARRAY[permission::text]::permission_grant_verb_t [],
	created_by
FROM user_data_provider_permissions
WHERE NOT is_expired(not_after)
ON CONFLICT DO NOTHING;

-- Migrate user group data provider permissions to permission_grants
INSERT INTO permission_grants (
	grantee_type,
	grantee_keycloak_organization_id,
	context_entity_type,
	data_provider_short_code,
	scope,
	verbs,
	created_by
)
SELECT
	'userGroup'::permission_grant_grantee_type_t,
	keycloak_organization_id,
	'dataProvider'::permission_grant_entity_type_t,
	data_provider_short_code,
	ARRAY['dataProvider']::permission_grant_entity_type_t [],
	ARRAY[permission::text]::permission_grant_verb_t [],
	created_by
FROM user_group_data_provider_permissions
WHERE NOT is_expired(not_after)
ON CONFLICT DO NOTHING;

-- Drop old data provider permission tables + audit triggers
SELECT deaudit_table('user_data_provider_permissions');
SELECT deaudit_table('user_group_data_provider_permissions');
DROP TABLE IF EXISTS user_data_provider_permissions CASCADE;
DROP TABLE IF EXISTS user_group_data_provider_permissions CASCADE;
