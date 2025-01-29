SELECT drop_function('user_group_data_provider_permission_to_json');

CREATE FUNCTION user_group_data_provider_permission_to_json(
	user_group_data_provider_permission user_group_data_provider_permissions
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'keycloakOrganizationId', user_group_data_provider_permission.keycloak_organization_id,
    'permission', user_group_data_provider_permission.permission,
    'dataProviderShortCode', user_group_data_provider_permission.data_provider_short_code,
    'createdBy', user_group_data_provider_permission.created_by,
    'createdAt', user_group_data_provider_permission.created_at
  );
END;
$$ LANGUAGE plpgsql;
