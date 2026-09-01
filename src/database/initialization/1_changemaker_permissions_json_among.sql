SELECT drop_function('changemaker_permissions_json_among');

-- Resolves the caller's permission map for each changemaker in `filter_ids`.
-- Bounding to `filter_ids` keeps the work proportional to the page rather than
-- to every grant in the table, which is what a per-changemaker resolver forced.
-- Changemakers with no resolved permissions are absent from the result; callers
-- coalesce the missing row to an empty map.
CREATE FUNCTION changemaker_permissions_json_among(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	filter_ids int []
) RETURNS TABLE (changemaker_id int, permissions jsonb) AS $$
	WITH native_scopes AS (
		SELECT
			unnest(ARRAY[
				'changemaker',
				'changemakerFieldValue',
				'initiative',
				'initiativeFieldValue',
				'proposal',
				'proposalFieldValue',
				'source'
			]::permission_grant_entity_type_t []) AS scope
	),

	all_verbs AS (
		SELECT unnest(enum_range(NULL::permission_grant_verb_t)) AS verb
	),

	resolved AS (
		SELECT
			input_id.id AS changemaker_id,
			native_scopes.scope,
			all_verbs.verb
		FROM unnest(changemaker_permissions_json_among.filter_ids) AS input_id (id)
			CROSS JOIN native_scopes
			CROSS JOIN all_verbs
		WHERE changemaker_permissions_json_among.user_is_admin

		UNION

		SELECT
			pg.changemaker_id,
			native_scopes.scope,
			all_verbs.verb
		FROM permission_grants pg
			CROSS JOIN native_scopes
			CROSS JOIN all_verbs
		WHERE
			changemaker_permissions_json_among.user_keycloak_user_id IS NOT NULL
			AND pg.context_entity_type = 'changemaker'
			AND pg.changemaker_id = ANY(changemaker_permissions_json_among.filter_ids)
			AND verb_set_permits_verb(pg.verbs, all_verbs.verb)
			AND scope_set_permits_scope(pg.scope, native_scopes.scope)
			AND (
				pg.conditions IS NULL
				OR NOT pg.conditions ? native_scopes.scope::text
			)
			AND grantee_permits_user(
				pg.grantee_type,
				pg.grantee_user_keycloak_user_id,
				pg.grantee_keycloak_organization_id,
				changemaker_permissions_json_among.user_keycloak_user_id
			)
	),

	scoped AS (
		SELECT
			resolved.changemaker_id,
			resolved.scope::text AS scope,
			jsonb_agg(resolved.verb ORDER BY resolved.verb) AS verbs
		FROM resolved
		GROUP BY resolved.changemaker_id, resolved.scope
	)

	SELECT
		scoped.changemaker_id,
		jsonb_object_agg(scoped.scope, scoped.verbs) AS permissions
	FROM scoped
	GROUP BY scoped.changemaker_id;
$$ LANGUAGE sql STABLE;
