SELECT drop_function('funder_to_json');

CREATE FUNCTION funder_to_json(funder funders)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'shortCode', funder.short_code,
    'name', funder.name,
    'createdAt', funder.created_at
  );
END;
$$ LANGUAGE plpgsql;
