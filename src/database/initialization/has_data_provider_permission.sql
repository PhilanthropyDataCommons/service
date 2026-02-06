CREATE OR REPLACE FUNCTION has_data_provider_permission(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	data_provider_short_code short_code_t,
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

	-- Check if the user has the specified permission on the specified data provider
	-- via direct user grant or group membership
	SELECT EXISTS (
		SELECT 1
		FROM permission_grants pg
		WHERE pg.context_entity_type = 'dataProvider'
			AND pg.data_provider_short_code
				= has_data_provider_permission.data_provider_short_code
			AND has_data_provider_permission.permission = ANY(pg.verbs)
			AND has_data_provider_permission.scope = ANY(pg.scope)
			AND (
				(
					pg.grantee_type = 'user'
					AND pg.grantee_user_keycloak_user_id
						= has_data_provider_permission.user_keycloak_user_id
				)
				OR (
					pg.grantee_type = 'userGroup'
					AND EXISTS (
						SELECT 1
						FROM ephemeral_user_group_associations euga
						WHERE euga.user_keycloak_user_id
							= has_data_provider_permission.user_keycloak_user_id
							AND euga.user_group_keycloak_organization_id
								= pg.grantee_keycloak_organization_id
					)
				)
			)
	) INTO has_permission;

	RETURN has_permission;
END;
$$ LANGUAGE plpgsql;
