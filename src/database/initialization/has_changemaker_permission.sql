SELECT drop_function('has_changemaker_permission');

CREATE FUNCTION has_changemaker_permission(
	user_keycloak_user_id uuid,
	user_is_admin boolean,
	changemaker_id int,
	verb permission_grant_verb_t,
	scope permission_grant_entity_type_t
) RETURNS boolean AS $$
DECLARE
	has_permission boolean;
BEGIN
	-- If the user is an administrator, they have all permissions
	IF user_is_admin THEN
		RETURN TRUE;
	END IF;

	-- Check if the user has the specified verb on the specified changemaker
	-- via direct user grant or group membership.
	SELECT EXISTS (
		SELECT 1
		FROM permission_grants pg
		WHERE pg.context_entity_type = 'changemaker'
			AND pg.changemaker_id
				= has_changemaker_permission.changemaker_id
			AND verb_set_permits_verb(
				pg.verbs, has_changemaker_permission.verb
			)
			AND scope_set_permits_scope(
				pg.scope, has_changemaker_permission.scope
			)
			AND grantee_permits_user(
				pg.grantee_type,
				pg.grantee_user_keycloak_user_id,
				pg.grantee_keycloak_organization_id,
				has_changemaker_permission.user_keycloak_user_id
			)
	) INTO has_permission;

	RETURN has_permission;
END;
$$ LANGUAGE plpgsql;
