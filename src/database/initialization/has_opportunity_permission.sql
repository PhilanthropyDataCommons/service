CREATE OR REPLACE FUNCTION has_opportunity_permission(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	opportunity_id int,
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

	-- Check if the user has the specified permission on the specified opportunity
	-- via direct user grant or group membership
	SELECT EXISTS (
		SELECT 1
		FROM permission_grants pg
		WHERE pg.context_entity_type = 'opportunity'
			AND pg.opportunity_id = has_opportunity_permission.opportunity_id
			AND has_opportunity_permission.permission = ANY(pg.verbs)
			AND has_opportunity_permission.scope = ANY(pg.scope)
			AND (
				(
					pg.grantee_type = 'user'
					AND pg.grantee_user_keycloak_user_id
						= has_opportunity_permission.user_keycloak_user_id
				)
				OR (
					pg.grantee_type = 'userGroup'
					AND EXISTS (
						SELECT 1
						FROM ephemeral_user_group_associations euga
						WHERE euga.user_keycloak_user_id
							= has_opportunity_permission.user_keycloak_user_id
							AND euga.user_group_keycloak_organization_id
								= pg.grantee_keycloak_organization_id
					)
				)
			)
	) INTO has_permission;

	RETURN has_permission;
END;
$$ LANGUAGE plpgsql;
