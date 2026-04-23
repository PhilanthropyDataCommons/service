CREATE OR REPLACE FUNCTION has_source_permission(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	source_id int,
	permission permission_grant_verb_t,
	scope permission_grant_entity_type_t
) RETURNS boolean AS $$
DECLARE
	has_permission boolean;
BEGIN
	-- If the user is an administrator, they have all permissions
	IF user_is_admin THEN
		RETURN TRUE;
	END IF;

	-- Check if the user has the specified permission on the specified source
	-- via direct user grant, group membership, or inherited from parent entities.
	-- Inherited grants are treated the same as direct source grants: the grant's
	-- scope array must include the requested scope.
	SELECT EXISTS (
		SELECT 1
		FROM sources s
		INNER JOIN permission_grants pg ON (
			-- Direct source grant
			(
				pg.context_entity_type = 'source'
				AND pg.source_id = s.id
			)
			-- Inherited from funder
			OR (
				pg.context_entity_type = 'funder'
				AND pg.funder_short_code = s.funder_short_code
			)
			-- Inherited from data provider
			OR (
				pg.context_entity_type = 'dataProvider'
				AND pg.data_provider_short_code = s.data_provider_short_code
			)
			-- Inherited from changemaker
			OR (
				pg.context_entity_type = 'changemaker'
				AND pg.changemaker_id = s.changemaker_id
			)
		)
		WHERE s.id = has_source_permission.source_id
			-- A granted 'manage' verb satisfies any verb check.
			AND (
				has_source_permission.permission = ANY(pg.verbs)
				OR 'manage' = ANY(pg.verbs)
			)
			AND has_source_permission.scope = ANY(pg.scope)
			AND (
				(
					pg.grantee_type = 'user'
					AND pg.grantee_user_keycloak_user_id
						= has_source_permission.user_keycloak_user_id
				)
				OR (
					pg.grantee_type = 'userGroup'
					AND EXISTS (
						SELECT 1
						FROM ephemeral_user_group_associations euga
						WHERE euga.user_keycloak_user_id
							= has_source_permission.user_keycloak_user_id
							AND euga.user_group_keycloak_organization_id
								= pg.grantee_keycloak_organization_id
							AND NOT is_expired(euga.not_after)
					)
				)
			)
	) INTO has_permission;

	RETURN has_permission;
END;
$$ LANGUAGE plpgsql;
