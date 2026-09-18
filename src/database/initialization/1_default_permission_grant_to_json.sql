SELECT drop_function('default_permission_grant_to_json');

CREATE FUNCTION default_permission_grant_to_json(
	default_permission_grant default_permission_grants
)
RETURNS jsonb AS $$
DECLARE
	created_by_user_json JSONB;
BEGIN
	SELECT user_to_json(users.*, NULL::uuid, FALSE)
	INTO created_by_user_json
	FROM users
	WHERE users.keycloak_user_id = default_permission_grant.created_by;

	RETURN jsonb_build_object(
		'id', default_permission_grant.id,
		'granteeType', default_permission_grant.grantee_type,
		'granteeUserKeycloakUserId',
		default_permission_grant.grantee_user_keycloak_user_id,
		'granteeKeycloakOrganizationId',
		default_permission_grant.grantee_keycloak_organization_id,
		'contextEntityType', default_permission_grant.context_entity_type,
		'scope', default_permission_grant.scope,
		'verbs', default_permission_grant.verbs,
		'createdBy', default_permission_grant.created_by,
		'createdByUser', created_by_user_json,
		'conditions', default_permission_grant.conditions,
		'createdAt', default_permission_grant.created_at
	);
END;
$$ LANGUAGE plpgsql;
