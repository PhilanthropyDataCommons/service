CREATE OR REPLACE FUNCTION has_opportunity_permission(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	opportunity_id int,
	opportunity_permission opportunity_permission_t
) RETURNS boolean AS $$
DECLARE
	has_permission boolean;
BEGIN
	-- If the user is an administrator, they have all permissions
	IF user_is_admin THEN
		RETURN TRUE;
	END IF;

	-- Check if the user has the specified permission on the specified opportunity
	SELECT EXISTS (
		SELECT 1
		FROM user_opportunity_permissions
		WHERE user_opportunity_permissions.user_keycloak_user_id = has_opportunity_permission.user_keycloak_user_id
			AND user_opportunity_permissions.opportunity_id = has_opportunity_permission.opportunity_id
			AND user_opportunity_permissions.opportunity_permission = has_opportunity_permission.opportunity_permission
	) OR EXISTS (
		SELECT 1
		FROM ephemeral_user_group_associations
		JOIN user_group_opportunity_permissions
			ON user_group_opportunity_permissions.keycloak_organization_id = ephemeral_user_group_associations.user_group_keycloak_organization_id
		WHERE ephemeral_user_group_associations.user_keycloak_user_id = has_opportunity_permission.user_keycloak_user_id
			AND user_group_opportunity_permissions.opportunity_id = has_opportunity_permission.opportunity_id
			AND user_group_opportunity_permissions.opportunity_permission = has_opportunity_permission.opportunity_permission
	) INTO has_permission;

	RETURN has_permission;
END;
$$ LANGUAGE plpgsql;
