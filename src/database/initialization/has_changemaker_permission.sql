SELECT drop_function('has_changemaker_permission');

CREATE OR REPLACE FUNCTION has_changemaker_permission(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	changemaker_id int,
	permission permission_t
) RETURNS boolean AS $$
DECLARE
	has_permission boolean;
BEGIN
	-- If the user is an administrator, they have all permissions
	IF user_is_admin THEN
		RETURN TRUE;
	END IF;

	-- Check if the user has the specified permission on the specified changemaker
	SELECT EXISTS (
		SELECT 1
		FROM user_changemaker_permissions
		WHERE user_changemaker_permissions.user_keycloak_user_id = has_changemaker_permission.user_keycloak_user_id
			AND user_changemaker_permissions.changemaker_id = has_changemaker_permission.changemaker_id
			AND user_changemaker_permissions.permission = has_changemaker_permission.permission
	) OR EXISTS (
		SELECT 1
		FROM ephemeral_user_group_associations
		JOIN user_group_changemaker_permissions
			ON user_group_changemaker_permissions.keycloak_organization_id = ephemeral_user_group_associations.user_group_keycloak_organization_id
		WHERE ephemeral_user_group_associations.user_keycloak_user_id = has_changemaker_permission.user_keycloak_user_id
			AND user_group_changemaker_permissions.changemaker_id = has_changemaker_permission.changemaker_id
			AND user_group_changemaker_permissions.permission = has_changemaker_permission.permission
	) INTO has_permission;

	RETURN has_permission;
END;
$$ LANGUAGE plpgsql;
