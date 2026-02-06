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
  -- Shallow changemaker (3rd arg) because the purpose is to get the changemaker ID.
  -- Not passing the auth context (2nd arg) because we want shallow fields anyway.
  SELECT changemaker_to_json(changemakers.*, NULL, TRUE)
  INTO changemaker_json
  FROM changemakers
  WHERE changemakers.keycloak_organization_id = keycloak_id
  AND has_changemaker_permission(
    auth_context_keycloak_user_id,
    auth_context_is_administrator,
    changemakers.id,
    'view',
    'changemaker'
  );

  SELECT data_provider_to_json(data_providers.*)
  INTO data_provider_json
  FROM data_providers
  WHERE data_providers.keycloak_organization_id = keycloak_id
  AND has_data_provider_permission(
    auth_context_keycloak_user_id,
    auth_context_is_administrator,
    data_providers.short_code,
    'view'
  );

  SELECT funder_to_json(funders.*)
  INTO funder_json
  FROM funders
  WHERE funders.keycloak_organization_id = keycloak_id
  AND has_funder_permission(
    auth_context_keycloak_user_id,
    auth_context_is_administrator,
    funders.short_code,
    'view'
  );

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
