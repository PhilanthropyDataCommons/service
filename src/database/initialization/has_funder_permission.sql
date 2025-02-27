CREATE OR REPLACE FUNCTION has_funder_permission(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	funder_short_code short_code_t,
	permission permission_t
) RETURNS boolean AS $$
DECLARE
	has_permission boolean;
BEGIN
	-- If the user is an administrator, they have all permissions
	IF user_is_admin THEN
		RETURN TRUE;
	END IF;

	-- Check if the user has the specified permission on the specified funder
	SELECT EXISTS (
		SELECT 1
		FROM user_funder_permissions
		WHERE user_funder_permissions.user_keycloak_user_id = has_funder_permission.user_keycloak_user_id
			AND user_funder_permissions.funder_short_code = has_funder_permission.funder_short_code
			AND user_funder_permissions.permission = has_funder_permission.permission
	) OR EXISTS (
		SELECT 1
		FROM ephemeral_user_group_associations
		JOIN user_group_funder_permissions
			ON user_group_funder_permissions.keycloak_organization_id = ephemeral_user_group_associations.user_group_keycloak_organization_id
		WHERE ephemeral_user_group_associations.user_keycloak_user_id = has_funder_permission.user_keycloak_user_id
			AND user_group_funder_permissions.funder_short_code = has_funder_permission.funder_short_code
			AND user_group_funder_permissions.permission = has_funder_permission.permission
	) INTO has_permission;

	RETURN has_permission;
END;
$$ LANGUAGE plpgsql;
