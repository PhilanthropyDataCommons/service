SELECT drop_function('user_to_json');

CREATE FUNCTION user_to_json("user" users)
RETURNS JSONB AS $$
DECLARE
  permissions_json JSONB := NULL::JSONB;
  user_changemaker_permissions_json JSONB := NULL::JSONB;
  user_funder_permissions_json JSONB := NULL::JSONB;
  user_data_provider_permissions_json JSONB := NULL::JSONB;
BEGIN
  user_changemaker_permissions_json := (
    SELECT jsonb_object_agg(
      aggregated_user_changemaker_permissions.changemaker_id, aggregated_user_changemaker_permissions.permissions
    )
    FROM (
      SELECT user_changemaker_permissions.changemaker_id, jsonb_agg(user_changemaker_permissions.permission) AS permissions
      FROM user_changemaker_permissions
      WHERE user_changemaker_permissions.user_keycloak_user_id = "user".keycloak_user_id
      GROUP BY user_changemaker_permissions.changemaker_id
    ) AS aggregated_user_changemaker_permissions
  );

  user_data_provider_permissions_json := (
    SELECT jsonb_object_agg(
      aggregated_user_data_provider_permissions.data_provider_short_code, aggregated_user_data_provider_permissions.permissions
    )
    FROM (
      SELECT user_data_provider_permissions.data_provider_short_code, jsonb_agg(user_data_provider_permissions.permission) AS permissions
      FROM user_data_provider_permissions
      WHERE user_data_provider_permissions.user_keycloak_user_id = "user".keycloak_user_id
      GROUP BY user_data_provider_permissions.data_provider_short_code
    ) AS aggregated_user_data_provider_permissions );

  user_funder_permissions_json := (
    SELECT jsonb_object_agg(
      aggregated_user_funder_permissions.funder_short_code, aggregated_user_funder_permissions.permissions
    )
    FROM (
      SELECT user_funder_permissions.funder_short_code, jsonb_agg(user_funder_permissions.permission) AS permissions
      FROM user_funder_permissions
      WHERE user_funder_permissions.user_keycloak_user_id = "user".keycloak_user_id
      GROUP BY user_funder_permissions.funder_short_code
    ) AS aggregated_user_funder_permissions
  );

  permissions_json := jsonb_build_object(
    'changemaker', COALESCE(user_changemaker_permissions_json, '{}'),
    'dataProvider', COALESCE(user_data_provider_permissions_json, '{}'),
    'funder', COALESCE(user_funder_permissions_json, '{}')
  );

  RETURN jsonb_build_object(
    'keycloakUserId', "user".keycloak_user_id,
    'permissions', permissions_json,
    'createdAt', "user".created_at
  );
END;
$$ LANGUAGE plpgsql;
