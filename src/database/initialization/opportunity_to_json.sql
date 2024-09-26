SELECT drop_function('opportunity_to_json');

CREATE FUNCTION opportunity_to_json(opportunity opportunities)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'id', opportunity.id,
    'title', opportunity.title,
    'createdAt', to_json(opportunity.created_at)::jsonb
  );
END;
$$ LANGUAGE plpgsql;
