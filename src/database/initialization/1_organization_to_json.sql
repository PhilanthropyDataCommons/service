SELECT drop_function('organization_to_json');

CREATE FUNCTION organization_to_json(
	keycloak_id uuid,
	auth_context_keycloak_user_id uuid,
	auth_context_is_administrator boolean,
	auth_context_can_view_organizations_in_keycloak boolean,
	auth_context_can_view_users_in_keycloak boolean
)
RETURNS jsonb AS $$
DECLARE
  changemaker_json JSONB := NULL::JSONB;
  data_provider_json JSONB := NULL::JSONB;
  funder_json JSONB := NULL::JSONB;
  members_json JSONB := NULL::JSONB;
  former_members_json JSONB := NULL::JSONB;
  is_organization_stored BOOLEAN := FALSE;
  is_organization_visible BOOLEAN;
  are_members_visible BOOLEAN;
  organization_name TEXT;
  organization_disabled_at TIMESTAMPTZ;
BEGIN
  SELECT changemaker_to_json(changemakers.*, NULL, NULL, NULL, TRUE, TRUE)
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

  SELECT funder_to_json(funders.*, NULL)
  INTO funder_json
  FROM funders
  INNER JOIN permitted_funder_short_codes(
    auth_context_keycloak_user_id,
    auth_context_is_administrator,
    'view',
    'funder'
  ) AS permitted_funders ON funders.short_code = permitted_funders.short_code
  WHERE funders.keycloak_organization_id = keycloak_id;

  SELECT
    count(*) > 0,
    max(organizations.keycloak_organization_name),
    max(organizations.disabled_at)
  INTO
    is_organization_stored,
    organization_name,
    organization_disabled_at
  FROM organizations
  WHERE organizations.keycloak_organization_id = keycloak_id;

  is_organization_visible :=
    coalesce(auth_context_is_administrator, false)
    OR coalesce(auth_context_can_view_organizations_in_keycloak, false);

  are_members_visible :=
    is_organization_visible
    AND (
      coalesce(auth_context_is_administrator, false)
      OR coalesce(auth_context_can_view_users_in_keycloak, false)
    );

  IF are_members_visible AND is_organization_stored THEN
    SELECT coalesce(
      jsonb_agg(
        user_to_json(users.*)
        ORDER BY memberships.created_at
      ),
      '[]'::jsonb
    )
    INTO members_json
    FROM user_organization_memberships AS memberships
    LEFT JOIN users ON users.keycloak_user_id
      = memberships.user_keycloak_user_id
    WHERE memberships.organization_keycloak_id = keycloak_id
      AND memberships.disabled_at IS NULL;

    SELECT coalesce(
      jsonb_agg(
        user_to_json(users.*)
        ORDER BY memberships.disabled_at
      ),
      '[]'::jsonb
    )
    INTO former_members_json
    FROM user_organization_memberships AS memberships
    LEFT JOIN users ON users.keycloak_user_id
      = memberships.user_keycloak_user_id
    WHERE memberships.organization_keycloak_id = keycloak_id
      AND memberships.disabled_at IS NOT NULL;
  END IF;

  RETURN
    CASE WHEN is_organization_visible AND is_organization_stored
      OR changemaker_json IS NOT NULL
      OR data_provider_json IS NOT NULL
      OR funder_json IS NOT NULL
    THEN
      jsonb_build_object(
        'keycloakOrganizationId', keycloak_id,
        'keycloakOrganizationName', organization_name,
        'disabledAt', organization_disabled_at,
        'changemaker', changemaker_json,
        'dataProvider', data_provider_json,
        'funder', funder_json,
        'members', members_json,
        'formerMembers', former_members_json
      )
    END CASE;
END;
$$ LANGUAGE plpgsql;
