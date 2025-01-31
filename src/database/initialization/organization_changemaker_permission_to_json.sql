SELECT drop_function('organization_changemaker_permission_to_json');

CREATE FUNCTION organization_changemaker_permission_to_json(
	organization_changemaker_permission organization_changemaker_permissions
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'keycloakOrganizationId', organization_changemaker_permission.keycloak_organization_id,
    'permission', organization_changemaker_permission.permission,
    'changemakerId', organization_changemaker_permission.changemaker_id,
    'createdBy', organization_changemaker_permission.created_by,
    'createdAt', organization_changemaker_permission.created_at
  );
END;
$$ LANGUAGE plpgsql;
