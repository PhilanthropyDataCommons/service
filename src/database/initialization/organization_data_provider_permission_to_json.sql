SELECT drop_function('organization_data_provider_permission_to_json');

CREATE FUNCTION organization_data_provider_permission_to_json(
	organization_data_provider_permission organization_data_provider_permissions
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'keycloakOrganizationId', organization_data_provider_permission.keycloak_organization_id,
    'permission', organization_data_provider_permission.permission,
    'dataProviderShortCode', organization_data_provider_permission.data_provider_short_code,
    'createdBy', organization_data_provider_permission.created_by,
    'createdAt', organization_data_provider_permission.created_at
  );
END;
$$ LANGUAGE plpgsql;
