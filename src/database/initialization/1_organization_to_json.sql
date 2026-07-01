SELECT drop_function('organization_to_json');

CREATE FUNCTION organization_to_json(
	keycloak_id uuid,
	auth_context_keycloak_user_id uuid,
	auth_context_is_administrator boolean
)
RETURNS jsonb AS $$
DECLARE
  changemaker_json JSONB := NULL::JSONB;
  data_provider_json JSONB := NULL::JSONB;
  funder_json JSONB := NULL::JSONB;
BEGIN
  -- Shallow changemaker (no children) because the purpose is the changemaker ID.
  SELECT changemaker_to_json(changemakers.*, NULL, NULL, TRUE)
  INTO changemaker_json
  FROM changemakers
  INNER JOIN permitted_changemaker_ids(
    auth_context_keycloak_user_id,
    auth_context_is_administrator,
    'view',
    'changemaker'
  ) AS permitted_changemakers ON changemakers.id = permitted_changemakers.id
  WHERE changemakers.keycloak_organization_id = keycloak_id;

  SELECT data_provider_to_json(data_providers.*)
  INTO data_provider_json
  FROM data_providers
  INNER JOIN permitted_data_provider_short_codes(
    auth_context_keycloak_user_id,
    auth_context_is_administrator,
    'view',
    'dataProvider'
  ) AS permitted_data_providers
    ON data_providers.short_code = permitted_data_providers.short_code
  WHERE data_providers.keycloak_organization_id = keycloak_id;

  SELECT funder_to_json(funders.*)
  INTO funder_json
  FROM funders
  INNER JOIN permitted_funder_short_codes(
    auth_context_keycloak_user_id,
    auth_context_is_administrator,
    'view',
    'funder'
  ) AS permitted_funders ON funders.short_code = permitted_funders.short_code
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
