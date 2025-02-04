SELECT drop_function('user_group_funder_permission_to_json');

CREATE FUNCTION user_group_funder_permission_to_json(
	user_group_funder_permission user_group_funder_permissions
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'keycloakOrganizationId', user_group_funder_permission.keycloak_organization_id,
    'funderShortCode', user_group_funder_permission.funder_short_code,
    'permission', user_group_funder_permission.permission,
    'createdBy', user_group_funder_permission.created_by,
    'createdAt', user_group_funder_permission.created_at
  );
END;
$$ LANGUAGE plpgsql;
