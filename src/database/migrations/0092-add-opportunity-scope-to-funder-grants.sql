-- Add 'opportunity' scope to existing funder grants that have 'funder'
-- scope. This preserves backward compatibility: users who previously had
-- funder-scope access implicitly had access to opportunities. Now that
-- opportunity permissions use explicit 'opportunity' scope, we add it
-- to maintain that behavior.

UPDATE permission_grants
SET
	scope
	= array_append(scope, 'opportunity'::permission_grant_entity_type_t)
WHERE
	context_entity_type = 'funder'
	AND 'funder' = any(scope)
	AND NOT ('opportunity' = any(scope));

-- Opportunity creation now requires 'create' verb with 'opportunity'
-- scope instead of 'edit' verb with 'funder' scope. Create new grants
-- to preserve the ability to create opportunities for users who
-- previously had edit permission on funders.

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
	ARRAY['opportunity']::permission_grant_entity_type_t [],
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
			AND 'opportunity' = any(pg2.scope)
	);
