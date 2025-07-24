SELECT drop_function('organization_to_json');

CREATE FUNCTION organization_to_json(keycloak_id uuid)
RETURNS jsonb AS $$
DECLARE
  changemaker_json JSONB := NULL::JSONB;
  data_provider_json JSONB := NULL::JSONB;
  funder_json JSONB := NULL::JSONB;
BEGIN
  -- Shallow here (3rd arg) because the purpose is to get the changemaker ID.
  SELECT changemaker_to_json(changemakers.*, NULL, TRUE)
  INTO changemaker_json
  FROM changemakers
  WHERE changemakers.keycloak_organization_id = keycloak_id;

  SELECT data_provider_to_json(data_providers.*)
  INTO data_provider_json
  FROM data_providers
  WHERE data_providers.keycloak_organization_id = keycloak_id;

  SELECT funder_to_json(funders.*)
  INTO funder_json
  FROM funders
  WHERE funders.keycloak_organization_id = keycloak_id;

  RETURN
    CASE WHEN changemaker_json IS NOT NULL
      OR data_provider_json IS NOT NULL
      OR funder_json IS NOT NULL
    THEN
      jsonb_build_object(
        'changemaker', changemaker_json,
        'data_provider', data_provider_json,
        'funder', funder_json
      )
    END CASE;
END;
$$ LANGUAGE plpgsql;
