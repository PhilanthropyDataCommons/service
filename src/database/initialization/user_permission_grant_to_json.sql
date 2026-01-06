SELECT drop_function('user_permission_grant_to_json');

CREATE FUNCTION user_permission_grant_to_json(
	user_permission_grant user_permission_grants
)
RETURNS jsonb AS $$
BEGIN
	RETURN jsonb_build_object(
		'id', user_permission_grant.id,
		'userKeycloakUserId', user_permission_grant.user_keycloak_user_id,
		'permissionVerb', user_permission_grant.permission_verb,
		'rootEntityType', user_permission_grant.root_entity_type,
		'rootEntityPk', user_permission_grant.root_entity_pk,
		'entities', user_permission_grant.entities,
		'createdBy', user_permission_grant.created_by,
		'createdAt', user_permission_grant.created_at,
		'notAfter', user_permission_grant.not_after
	);
END;
$$ LANGUAGE plpgsql;
