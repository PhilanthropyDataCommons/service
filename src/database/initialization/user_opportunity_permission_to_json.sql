SELECT drop_function('user_opportunity_permission_to_json');

CREATE FUNCTION user_opportunity_permission_to_json(
	user_opportunity_permission user_opportunity_permissions
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'userKeycloakUserId', user_opportunity_permission.user_keycloak_user_id,
    'opportunityPermission', user_opportunity_permission.opportunity_permission,
    'opportunityId', user_opportunity_permission.opportunity_id,
    'createdBy', user_opportunity_permission.created_by,
    'createdAt', user_opportunity_permission.created_at
  );
END;
$$ LANGUAGE plpgsql;
