SELECT drop_function('user_to_json');

CREATE FUNCTION user_to_json("user" users)
RETURNS jsonb AS $$
DECLARE
  permissions_json JSONB := NULL::JSONB;
  user_changemaker_permissions_json JSONB := NULL::JSONB;
  user_funder_permissions_json JSONB := NULL::JSONB;
  user_data_provider_permissions_json JSONB := NULL::JSONB;
  user_opportunity_permissions_json JSONB := NULL::JSONB;
BEGIN
  user_changemaker_permissions_json := (
    SELECT jsonb_object_agg(
      aggregated_combined_changemaker_permissions.changemaker_id,
      aggregated_combined_changemaker_permissions.permissions
    )
    FROM (
      SELECT
        combined_changemaker_permissions.changemaker_id,
        jsonb_agg(combined_changemaker_permissions.permission) AS permissions
      FROM (
        (
          SELECT
            user_changemaker_permissions.changemaker_id AS changemaker_id,
            user_changemaker_permissions.permission AS permission
          FROM user_changemaker_permissions
          WHERE user_changemaker_permissions.user_keycloak_user_id = "user".keycloak_user_id
            AND NOT is_expired(user_changemaker_permissions.not_after)
        )
        UNION
        (
          SELECT
            user_group_changemaker_permissions.changemaker_id AS changemaker_id,
            user_group_changemaker_permissions.permission AS permission
          FROM ephemeral_user_group_associations
          JOIN user_group_changemaker_permissions
          ON ephemeral_user_group_associations.user_group_keycloak_organization_id = user_group_changemaker_permissions.keycloak_organization_id
          WHERE ephemeral_user_group_associations.user_keycloak_user_id = "user".keycloak_user_id
            AND NOT is_expired(ephemeral_user_group_associations.not_after)
        )
      ) as combined_changemaker_permissions
      GROUP BY combined_changemaker_permissions.changemaker_id
    ) AS aggregated_combined_changemaker_permissions
  );

  user_data_provider_permissions_json := (
    SELECT jsonb_object_agg(
      aggregated_combined_data_provider_permissions.data_provider_short_code,
      aggregated_combined_data_provider_permissions.permissions
    )
    FROM (
      SELECT
        combined_data_provider_permissions.data_provider_short_code,
        jsonb_agg(combined_data_provider_permissions.permission) AS permissions
      FROM (
        (
          SELECT
            user_data_provider_permissions.data_provider_short_code AS data_provider_short_code,
            user_data_provider_permissions.permission AS permission
          FROM user_data_provider_permissions
          WHERE user_data_provider_permissions.user_keycloak_user_id = "user".keycloak_user_id
            AND NOT is_expired(user_data_provider_permissions.not_after)
        )
        UNION
        (
          SELECT
            user_group_data_provider_permissions.data_provider_short_code AS data_provider_short_code,
            user_group_data_provider_permissions.permission AS permission
          FROM ephemeral_user_group_associations
          JOIN user_group_data_provider_permissions
            ON ephemeral_user_group_associations.user_group_keycloak_organization_id = user_group_data_provider_permissions.keycloak_organization_id
          WHERE ephemeral_user_group_associations.user_keycloak_user_id = "user".keycloak_user_id
            AND NOT is_expired(ephemeral_user_group_associations.not_after)
        )
      ) as combined_data_provider_permissions
      GROUP BY combined_data_provider_permissions.data_provider_short_code
    ) AS aggregated_combined_data_provider_permissions );

  user_funder_permissions_json := (
    SELECT jsonb_object_agg(
      aggregated_combined_funder_permissions.funder_short_code,
      aggregated_combined_funder_permissions.permissions
    )
    FROM (
      SELECT
        combined_funder_permissions.funder_short_code,
        jsonb_agg(combined_funder_permissions.permission) AS permissions
      FROM (
        (
          SELECT
            user_funder_permissions.funder_short_code AS funder_short_code,
            user_funder_permissions.permission AS permission
          FROM user_funder_permissions
          WHERE user_funder_permissions.user_keycloak_user_id = "user".keycloak_user_id
            AND NOT is_expired(user_funder_permissions.not_after)
        )
        UNION
        (
          SELECT
            user_group_funder_permissions.funder_short_code AS funder_short_code,
            user_group_funder_permissions.permission AS permission
          FROM ephemeral_user_group_associations
          JOIN user_group_funder_permissions
            ON ephemeral_user_group_associations.user_group_keycloak_organization_id = user_group_funder_permissions.keycloak_organization_id
          WHERE ephemeral_user_group_associations.user_keycloak_user_id = "user".keycloak_user_id
            AND NOT is_expired(ephemeral_user_group_associations.not_after)
        )
      ) as combined_funder_permissions
      GROUP BY combined_funder_permissions.funder_short_code
    ) AS aggregated_combined_funder_permissions
  );

  user_opportunity_permissions_json := (
    SELECT jsonb_object_agg(
      aggregated_combined_opportunity_permissions.opportunity_id,
      aggregated_combined_opportunity_permissions.opportunity_permissions
    )
    FROM (
      SELECT
        combined_opportunity_permissions.opportunity_id,
        jsonb_agg(combined_opportunity_permissions.opportunity_permission) AS opportunity_permissions
      FROM (
        (
          SELECT
            user_opportunity_permissions.opportunity_id AS opportunity_id,
            user_opportunity_permissions.opportunity_permission AS opportunity_permission
          FROM user_opportunity_permissions
          WHERE user_opportunity_permissions.user_keycloak_user_id = "user".keycloak_user_id
            AND NOT is_expired(user_opportunity_permissions.not_after)
        )
        UNION
        (
          SELECT
            user_group_opportunity_permissions.opportunity_id AS opportunity_id,
            user_group_opportunity_permissions.opportunity_permission AS opportunity_permission
          FROM ephemeral_user_group_associations
          JOIN user_group_opportunity_permissions
            ON ephemeral_user_group_associations.user_group_keycloak_organization_id = user_group_opportunity_permissions.keycloak_organization_id
          WHERE ephemeral_user_group_associations.user_keycloak_user_id = "user".keycloak_user_id
            AND NOT is_expired(ephemeral_user_group_associations.not_after)
        )
      ) as combined_opportunity_permissions
      GROUP BY combined_opportunity_permissions.opportunity_id
    ) AS aggregated_combined_opportunity_permissions
  );

  permissions_json := jsonb_build_object(
    'changemaker', COALESCE(user_changemaker_permissions_json, '{}'),
    'dataProvider', COALESCE(user_data_provider_permissions_json, '{}'),
    'funder', COALESCE(user_funder_permissions_json, '{}'),
    'opportunity', COALESCE(user_opportunity_permissions_json, '{}')
  );

  RETURN jsonb_build_object(
    'keycloakUserId', "user".keycloak_user_id,
    'keycloakUserName', "user".keycloak_user_name,
    'permissions', permissions_json,
    'createdAt', "user".created_at
  );
END;
$$ LANGUAGE plpgsql;
