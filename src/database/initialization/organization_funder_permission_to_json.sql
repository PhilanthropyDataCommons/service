SELECT drop_function('organization_funder_permission_to_json');

CREATE FUNCTION organization_funder_permission_to_json(
	organization_funder_permission organization_funder_permissions
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'organizationKeycloakId', organization_funder_permission.organization_keycloak_id,
    'permission', organization_funder_permission.permission,
    'funderShortCode', organization_funder_permission.funder_short_code,
    'createdBy', organization_funder_permission.created_by,
    'createdAt', organization_funder_permission.created_at
  );
END;
$$ LANGUAGE plpgsql;
