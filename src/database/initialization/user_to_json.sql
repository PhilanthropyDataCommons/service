SELECT drop_function('user_to_json');

CREATE FUNCTION user_to_json("user" users)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'id', "user".id,
    'authenticationId', "user".authentication_id,
    'createdAt', "user".created_at
  );
END;
$$ LANGUAGE plpgsql;
