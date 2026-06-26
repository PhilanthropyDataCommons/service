SELECT drop_function('opportunity_to_json');

CREATE FUNCTION opportunity_to_json(
	opportunity opportunities,
	auth_context_keycloak_user_id uuid DEFAULT NULL,
	auth_context_is_administrator boolean DEFAULT FALSE
)
RETURNS jsonb AS $$
DECLARE
  funder_json JSONB;
  terminology_set_json JSONB;
BEGIN
  SELECT funder_to_json(funders.*)
  INTO funder_json
  FROM funders
  WHERE funders.short_code = opportunity.funder_short_code;

  -- Only embed the terminology set when the caller is permitted to view it.
  -- The terminologySetId is always returned, but the inlined details are
  -- gated behind `view | terminologySet`.
  IF opportunity.terminology_set_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM permitted_terminology_set_ids(
        auth_context_keycloak_user_id,
        auth_context_is_administrator,
        'view',
        'terminologySet'
      ) AS permitted_terminology_sets
      WHERE permitted_terminology_sets.id = opportunity.terminology_set_id
    ) THEN
    SELECT terminology_set_to_json(terminology_sets.*)
    INTO terminology_set_json
    FROM terminology_sets
    WHERE terminology_sets.id = opportunity.terminology_set_id;
  END IF;

  RETURN jsonb_build_object(
    'id', opportunity.id,
    'title', opportunity.title,
    'funderShortCode', opportunity.funder_short_code,
    'funder', funder_json,
    'terminologySetId', opportunity.terminology_set_id,
    'terminologySet', terminology_set_json,
    'createdAt', to_json(opportunity.created_at),
    'createdBy', to_json(opportunity.created_by)
  );
END;
$$ LANGUAGE plpgsql;
