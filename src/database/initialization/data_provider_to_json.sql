SELECT drop_function('data_provider_to_json');

CREATE FUNCTION data_provider_to_json(data_provider data_providers)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'shortCode', data_provider.short_code,
    'name', data_provider.name,
    'keycloakOrganizationId', data_provider.keycloak_organization_id,
    'createdAt', data_provider.created_at
  );
END;
$$ LANGUAGE plpgsql;
