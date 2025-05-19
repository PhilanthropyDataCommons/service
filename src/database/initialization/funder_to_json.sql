SELECT drop_function('funder_to_json');

CREATE FUNCTION funder_to_json(funder funders)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'shortCode', funder.short_code,
    'name', funder.name,
    'keycloakOrganizationId', funder.keycloak_organization_id,
    'createdAt', funder.created_at,
    'isCollaborative', funder.is_collaborative
  );
END;
$$ LANGUAGE plpgsql;
