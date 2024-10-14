SELECT drop_function('user_to_json');

CREATE FUNCTION user_to_json("user" users)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'keycloakUserId', "user".keycloak_user_id,
    'createdAt', "user".created_at
  );
END;
$$ LANGUAGE plpgsql;
