CREATE OR REPLACE FUNCTION has_changemaker_permission(
	user_keycloak_user_id uuid,
	changemaker_id integer,
	permission permission_t
)
RETURNS boolean AS $$
BEGIN
	RETURN EXISTS(
		SELECT 1
		FROM user_changemaker_permissions
		WHERE user_changemaker_permissions.user_keycloak_user_id = user_keycloak_user_id
			AND user_changemaker_permissions.changemaker_id = changemaker_id
			AND user_changemaker_permissions.permission = permission
	) OR EXISTS(
		SELECT 1
		FROM user_group_changemaker_permissions
		JOIN ephemeral_user_group_associations
			ON user_group_changemaker_permissions.keycloak_organization_id = ephemeral_user_group_associations.keycloak_organization_id
		WHERE ephemeral_user_group_associations.user_keycloak_user_id = user_keycloak_user_id
			AND user_group_changemaker_permissions.changemaker_id = changemaker_id
			AND user_group_changemaker_permissions.permission = permission
			AND NOT is_expired(ephemeral_user_group_associations.not_after)
	);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION has_data_provider_permission(
	user_keycloak_user_id uuid,
	data_provider_shortcode short_code_t,
	permission permission_t
)
RETURNS boolean AS $$
BEGIN
	RETURN EXISTS(
		SELECT 1
		FROM user_data_provider_permissions
		WHERE user_data_provider_permissions.user_keycloak_user_id = user_keycloak_user_id
			AND user_data_provider_permissions.data_provider_shortcode = data_provider_shortcode
			AND user_data_provider_permissions.permission = permission
	) OR EXISTS(
		SELECT 1
		FROM user_group_data_provider_permissions
		JOIN ephemeral_user_group_associations
			ON user_group_data_provider_permissions.keycloak_organization_id = ephemeral_user_group_associations.keycloak_organization_id
		WHERE ephemeral_user_group_associations.user_keycloak_user_id = user_keycloak_user_id
			AND user_group_data_provider_permissions.data_provider_shortcode = data_provider_shortcode
			AND user_group_data_provider_permissions.permission = permission
			AND NOT is_expired(ephemeral_user_group_associations.not_after)
	);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION has_funder_permission(
	user_keycloak_user_id uuid,
	funder_shortcode short_code_t,
	permission permission_t
)
RETURNS boolean AS $$
BEGIN
	RETURN EXISTS(
		SELECT 1
		FROM user_funder_permissions
		WHERE user_funder_permissions.user_keycloak_user_id = user_keycloak_user_id
			AND user_funder_permissions.funder_shortcode = funder_shortcode
			AND user_funder_permissions.permission = permission
	) OR EXISTS(
		SELECT 1
		FROM user_group_funder_permissions
		JOIN ephemeral_user_group_associations
			ON user_group_funder_permissions.keycloak_organization_id = ephemeral_user_group_associations.keycloak_organization_id
		WHERE ephemeral_user_group_associations.user_keycloak_user_id = user_keycloak_user_id
			AND user_group_funder_permissions.funder_id = funder_id
			AND user_group_funder_permissions.permission = permission
			AND NOT is_expired(ephemeral_user_group_associations.not_after)
	);
END;
$$ LANGUAGE plpgsql;
