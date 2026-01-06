SELECT drop_function('user_group_permission_grant_to_json');

CREATE FUNCTION user_group_permission_grant_to_json(
	user_group_permission_grant user_group_permission_grants
)
RETURNS jsonb AS $$
BEGIN
	RETURN jsonb_build_object(
		'id', user_group_permission_grant.id,
		'keycloakOrganizationId', user_group_permission_grant.keycloak_organization_id,
		'permissionVerb', user_group_permission_grant.permission_verb,
		'rootEntityType', user_group_permission_grant.root_entity_type,
		'rootEntityPk', user_group_permission_grant.root_entity_pk,
		'entities', user_group_permission_grant.entities,
		'createdBy', user_group_permission_grant.created_by,
		'createdAt', user_group_permission_grant.created_at,
		'notAfter', user_group_permission_grant.not_after
	);
END;
$$ LANGUAGE plpgsql;
