-- Add 'source' scope to existing permission grants that have the
-- scope of their own context entity type. Previously sources were
-- viewable by any authenticated user; this change preserves the
-- ability to view sources for users who already have some level of
-- access to the source's parent entity.

UPDATE permission_grants
SET scope = array_append(scope, 'source'::permission_grant_entity_type_t)
WHERE
	context_entity_type = 'funder'
	AND 'funder' = any(scope)
	AND NOT ('source' = any(scope));

UPDATE permission_grants
SET scope = array_append(scope, 'source'::permission_grant_entity_type_t)
WHERE
	context_entity_type = 'dataProvider'
	AND 'dataProvider' = any(scope)
	AND NOT ('source' = any(scope));

UPDATE permission_grants
SET scope = array_append(scope, 'source'::permission_grant_entity_type_t)
WHERE
	context_entity_type = 'changemaker'
	AND 'changemaker' = any(scope)
	AND NOT ('source' = any(scope));

-- Source creation now requires 'create' verb with 'source' scope
-- instead of 'edit' verb with the parent entity's scope. Create new
-- grants so users who previously could create sources retain that
-- ability.

INSERT INTO permission_grants (
	grantee_type,
	grantee_user_keycloak_user_id,
	grantee_keycloak_organization_id,
	context_entity_type,
	funder_short_code,
	scope,
	verbs,
	created_by
)
SELECT DISTINCT ON (
	pg.grantee_type,
	pg.grantee_user_keycloak_user_id,
	pg.grantee_keycloak_organization_id,
	pg.funder_short_code
)
	pg.grantee_type,
	pg.grantee_user_keycloak_user_id,
	pg.grantee_keycloak_organization_id,
	pg.context_entity_type,
	pg.funder_short_code,
	ARRAY['source']::permission_grant_entity_type_t [],
	ARRAY['create']::permission_grant_verb_t [],
	pg.created_by
FROM permission_grants AS pg
WHERE
	pg.context_entity_type = 'funder'
	AND 'edit' = any(pg.verbs)
	AND 'funder' = any(pg.scope)
	AND NOT EXISTS (
		SELECT 1
		FROM permission_grants AS pg2
		WHERE
			pg2.context_entity_type = 'funder'
			AND pg2.funder_short_code = pg.funder_short_code
			AND pg2.grantee_type = pg.grantee_type
			AND (
				(
					pg2.grantee_type = 'user'
					AND pg2.grantee_user_keycloak_user_id
					= pg.grantee_user_keycloak_user_id
				)
				OR (
					pg2.grantee_type = 'userGroup'
					AND pg2.grantee_keycloak_organization_id
					= pg.grantee_keycloak_organization_id
				)
			)
			AND 'create' = any(pg2.verbs)
			AND 'source' = any(pg2.scope)
	);

INSERT INTO permission_grants (
	grantee_type,
	grantee_user_keycloak_user_id,
	grantee_keycloak_organization_id,
	context_entity_type,
	data_provider_short_code,
	scope,
	verbs,
	created_by
)
SELECT DISTINCT ON (
	pg.grantee_type,
	pg.grantee_user_keycloak_user_id,
	pg.grantee_keycloak_organization_id,
	pg.data_provider_short_code
)
	pg.grantee_type,
	pg.grantee_user_keycloak_user_id,
	pg.grantee_keycloak_organization_id,
	pg.context_entity_type,
	pg.data_provider_short_code,
	ARRAY['source']::permission_grant_entity_type_t [],
	ARRAY['create']::permission_grant_verb_t [],
	pg.created_by
FROM permission_grants AS pg
WHERE
	pg.context_entity_type = 'dataProvider'
	AND 'edit' = any(pg.verbs)
	AND 'dataProvider' = any(pg.scope)
	AND NOT EXISTS (
		SELECT 1
		FROM permission_grants AS pg2
		WHERE
			pg2.context_entity_type = 'dataProvider'
			AND pg2.data_provider_short_code = pg.data_provider_short_code
			AND pg2.grantee_type = pg.grantee_type
			AND (
				(
					pg2.grantee_type = 'user'
					AND pg2.grantee_user_keycloak_user_id
					= pg.grantee_user_keycloak_user_id
				)
				OR (
					pg2.grantee_type = 'userGroup'
					AND pg2.grantee_keycloak_organization_id
					= pg.grantee_keycloak_organization_id
				)
			)
			AND 'create' = any(pg2.verbs)
			AND 'source' = any(pg2.scope)
	);

INSERT INTO permission_grants (
	grantee_type,
	grantee_user_keycloak_user_id,
	grantee_keycloak_organization_id,
	context_entity_type,
	changemaker_id,
	scope,
	verbs,
	created_by
)
SELECT DISTINCT ON (
	pg.grantee_type,
	pg.grantee_user_keycloak_user_id,
	pg.grantee_keycloak_organization_id,
	pg.changemaker_id
)
	pg.grantee_type,
	pg.grantee_user_keycloak_user_id,
	pg.grantee_keycloak_organization_id,
	pg.context_entity_type,
	pg.changemaker_id,
	ARRAY['source']::permission_grant_entity_type_t [],
	ARRAY['create']::permission_grant_verb_t [],
	pg.created_by
FROM permission_grants AS pg
WHERE
	pg.context_entity_type = 'changemaker'
	AND 'edit' = any(pg.verbs)
	AND 'changemaker' = any(pg.scope)
	AND NOT EXISTS (
		SELECT 1
		FROM permission_grants AS pg2
		WHERE
			pg2.context_entity_type = 'changemaker'
			AND pg2.changemaker_id = pg.changemaker_id
			AND pg2.grantee_type = pg.grantee_type
			AND (
				(
					pg2.grantee_type = 'user'
					AND pg2.grantee_user_keycloak_user_id
					= pg.grantee_user_keycloak_user_id
				)
				OR (
					pg2.grantee_type = 'userGroup'
					AND pg2.grantee_keycloak_organization_id
					= pg.grantee_keycloak_organization_id
				)
			)
			AND 'create' = any(pg2.verbs)
			AND 'source' = any(pg2.scope)
	);
