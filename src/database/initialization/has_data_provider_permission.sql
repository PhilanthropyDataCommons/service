CREATE OR REPLACE FUNCTION has_data_provider_permission(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	data_provider_short_code short_code_t,
	permission permission_t
) RETURNS boolean AS $$
DECLARE
	has_permission boolean;
BEGIN
	-- If the user is an administrator, they have all permissions
	IF user_is_admin THEN
		RETURN TRUE;
	END IF;

	-- Check if the user has the specified permission on the specified data provider
	SELECT EXISTS (
		SELECT 1
		FROM user_data_provider_permissions
		WHERE user_data_provider_permissions.user_keycloak_user_id = has_data_provider_permission.user_keycloak_user_id
			AND user_data_provider_permissions.data_provider_short_code = has_data_provider_permission.data_provider_short_code
			AND user_data_provider_permissions.permission = has_data_provider_permission.permission
	) OR EXISTS (
		SELECT 1
		FROM ephemeral_user_group_associations
		JOIN user_group_data_provider_permissions
			ON user_group_data_provider_permissions.keycloak_organization_id = ephemeral_user_group_associations.user_group_keycloak_organization_id
		WHERE ephemeral_user_group_associations.user_keycloak_user_id = has_data_provider_permission.user_keycloak_user_id
			AND user_group_data_provider_permissions.data_provider_short_code = has_data_provider_permission.data_provider_short_code
			AND user_group_data_provider_permissions.permission = has_data_provider_permission.permission
	) INTO has_permission;

	RETURN has_permission;
END;
$$ LANGUAGE plpgsql;
