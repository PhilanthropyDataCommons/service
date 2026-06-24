SELECT drop_function('user_to_json');

CREATE FUNCTION user_to_json(
	"user" users,
	auth_context_keycloak_user_id uuid,
	auth_context_is_administrator boolean
)
RETURNS jsonb AS $$
BEGIN
	RETURN jsonb_build_object(
		'keycloakUserId', "user".keycloak_user_id,
		'keycloakUserName', "user".keycloak_user_name,
		'createdAt', "user".created_at
	);
END;
$$ LANGUAGE plpgsql;
