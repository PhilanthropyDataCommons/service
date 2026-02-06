SELECT drop_function('user_to_json');

CREATE FUNCTION user_to_json(
	"user" users,
	auth_context_keycloak_user_id uuid,
	auth_context_is_administrator boolean
)
RETURNS jsonb AS $$
DECLARE
	permissions_json jsonb := NULL::jsonb;
	user_opportunity_permissions_json jsonb := NULL::jsonb;
BEGIN
	-- Only include permissions if the requester is the user themselves or an administrator
	IF auth_context_keycloak_user_id = "user".keycloak_user_id
		OR auth_context_is_administrator = TRUE THEN
		user_opportunity_permissions_json := (
			SELECT jsonb_object_agg(
				aggregated_combined_opportunity_permissions.opportunity_id,
				aggregated_combined_opportunity_permissions.opportunity_permissions
			)
			FROM (
				SELECT
					combined_opportunity_permissions.opportunity_id,
					jsonb_agg(
						combined_opportunity_permissions.opportunity_permission
					) AS opportunity_permissions
				FROM (
					(
						SELECT
							user_opportunity_permissions.opportunity_id
								AS opportunity_id,
							user_opportunity_permissions.opportunity_permission
								AS opportunity_permission
						FROM user_opportunity_permissions
						WHERE user_opportunity_permissions.user_keycloak_user_id
							= "user".keycloak_user_id
							AND NOT is_expired(
								user_opportunity_permissions.not_after
							)
					)
					UNION
					(
						SELECT
							user_group_opportunity_permissions.opportunity_id
								AS opportunity_id,
							user_group_opportunity_permissions.opportunity_permission
								AS opportunity_permission
						FROM ephemeral_user_group_associations
						INNER JOIN user_group_opportunity_permissions
							ON ephemeral_user_group_associations.user_group_keycloak_organization_id
								= user_group_opportunity_permissions.keycloak_organization_id
						WHERE ephemeral_user_group_associations.user_keycloak_user_id
							= "user".keycloak_user_id
							AND NOT is_expired(
								ephemeral_user_group_associations.not_after
							)
					)
				) AS combined_opportunity_permissions
				GROUP BY combined_opportunity_permissions.opportunity_id
			) AS aggregated_combined_opportunity_permissions
		);
	END IF;

	permissions_json := jsonb_build_object(
		'opportunity', coalesce(user_opportunity_permissions_json, '{}')
	);

	RETURN jsonb_build_object(
		'keycloakUserId', "user".keycloak_user_id,
		'keycloakUserName', "user".keycloak_user_name,
		'permissions', permissions_json,
		'createdAt', "user".created_at
	);
END;
$$ LANGUAGE plpgsql;
