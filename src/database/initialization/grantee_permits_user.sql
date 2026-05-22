SELECT drop_function('grantee_permits_user');

-- Returns TRUE when the grant's grantee covers `user_keycloak_user_id` —
-- either because the grant is to all authenticated users, directly to that
-- user, or to a user group the user currently belongs to.
CREATE FUNCTION grantee_permits_user(
	grantee_type permission_grant_grantee_type_t,
	grantee_user_keycloak_user_id uuid,
	grantee_keycloak_organization_id uuid,
	user_keycloak_user_id uuid
) RETURNS boolean AS $$
	SELECT grantee_type = 'authenticatedUsers'
		OR (
			grantee_type = 'user'
			AND grantee_user_keycloak_user_id
				= grantee_permits_user.user_keycloak_user_id
		)
		OR (
			grantee_type = 'userGroup'
			AND EXISTS (
				SELECT 1
				FROM ephemeral_user_group_associations euga
				WHERE euga.user_keycloak_user_id
						= grantee_permits_user.user_keycloak_user_id
					AND euga.user_group_keycloak_organization_id
						= grantee_permits_user.grantee_keycloak_organization_id
					AND NOT is_expired(euga.not_after)
			)
		);
$$ LANGUAGE sql STABLE;
