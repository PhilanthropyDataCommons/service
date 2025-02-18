SELECT drop_function('opportunity_to_json');

CREATE FUNCTION opportunity_to_json(opportunity opportunities)
RETURNS jsonb AS $$
DECLARE
  funder_json JSONB;
BEGIN
  SELECT funder_to_json(funders.*)
  INTO funder_json
  FROM funders
  WHERE funders.short_code = opportunity.funder_short_code;

  RETURN jsonb_build_object(
    'id', opportunity.id,
    'title', opportunity.title,
    'funderShortCode', opportunity.funder_short_code,
    'funder', funder_json,
    'createdAt', to_json(opportunity.created_at)::jsonb
  );
END;
$$ LANGUAGE plpgsql;
