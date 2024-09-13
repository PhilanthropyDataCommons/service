CREATE OR REPLACE FUNCTION user_to_json("user" users)
RETURNS JSONB AS $$
DECLARE
  source_json JSONB := NULL::JSONB;
BEGIN
  SELECT source_to_json(sources.*)
  INTO source_json
  FROM sources
  WHERE sources.id = "user".source_id;

  RETURN jsonb_strip_nulls(jsonb_build_object(
    'id', "user".id,
    'authenticationId', "user".authentication_id,
    'sourceId', "user".source_id,
    'source', source_json,
    'createdAt', "user".created_at
  ));
END;
$$ LANGUAGE plpgsql;
