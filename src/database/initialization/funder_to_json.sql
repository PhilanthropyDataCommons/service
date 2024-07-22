CREATE OR REPLACE FUNCTION funder_to_json(funder funders)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'id', funder.id,
    'name', funder.name,
    'createdAt', funder.created_at
  );
END;
$$ LANGUAGE plpgsql;
