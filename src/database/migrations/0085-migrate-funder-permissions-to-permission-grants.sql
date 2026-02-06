-- Migrate user funder permissions to permission_grants
INSERT INTO permission_grants (
	grantee_type,
	grantee_user_keycloak_user_id,
	context_entity_type,
	funder_short_code,
	scope,
	verbs,
	created_by
)
SELECT
	'user'::permission_grant_grantee_type_t,
	user_keycloak_user_id,
	'funder'::permission_grant_entity_type_t,
	funder_short_code,
	ARRAY['funder']::permission_grant_entity_type_t [],
	ARRAY[permission::text]::permission_grant_verb_t [],
	created_by
FROM user_funder_permissions
WHERE NOT is_expired(not_after)
ON CONFLICT DO NOTHING;

-- Migrate user group funder permissions to permission_grants
INSERT INTO permission_grants (
	grantee_type,
	grantee_keycloak_organization_id,
	context_entity_type,
	funder_short_code,
	scope,
	verbs,
	created_by
)
SELECT
	'userGroup'::permission_grant_grantee_type_t,
	keycloak_organization_id,
	'funder'::permission_grant_entity_type_t,
	funder_short_code,
	ARRAY['funder']::permission_grant_entity_type_t [],
	ARRAY[permission::text]::permission_grant_verb_t [],
	created_by
FROM user_group_funder_permissions
WHERE NOT is_expired(not_after)
ON CONFLICT DO NOTHING;

-- Drop old funder permission tables + audit triggers
SELECT deaudit_table('user_funder_permissions');
SELECT deaudit_table('user_group_funder_permissions');
DROP TABLE IF EXISTS user_funder_permissions CASCADE;
DROP TABLE IF EXISTS user_group_funder_permissions CASCADE;
