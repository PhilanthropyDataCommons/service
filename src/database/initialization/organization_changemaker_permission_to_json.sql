SELECT drop_function('organzation_changemaker_permission_to_json');

CREATE FUNCTION organzation_changemaker_permission_to_json(
	organzation_changemaker_permission organzation_changemaker_permissions
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'organzationKeycloakId', organzation_changemaker_permission.organzation_keycloak_id,
    'permission', organzation_changemaker_permission.permission,
    'changemakerId', organzation_changemaker_permission.changemaker_id,
    'createdBy', organzation_changemaker_permission.created_by,
    'createdAt', organzation_changemaker_permission.created_at
  );
END;
$$ LANGUAGE plpgsql;
