SELECT drop_function('user_group_opportunity_permission_to_json');

CREATE FUNCTION user_group_opportunity_permission_to_json(
	user_group_opportunity_permission user_group_opportunity_permissions
)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'keycloakOrganizationId', user_group_opportunity_permission.keycloak_organization_id,
    'opportunityId', user_group_opportunity_permission.opportunity_id,
    'opportunityPermission', user_group_opportunity_permission.opportunity_permission,
    'createdBy', user_group_opportunity_permission.created_by,
    'createdAt', user_group_opportunity_permission.created_at
  );
END;
$$ LANGUAGE plpgsql;
