SELECT drop_function('funder_to_json');

CREATE FUNCTION funder_to_json(funder funders)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'shortCode', funder.short_code,
    'name', funder.name,
    'keycloakOrganizationId', funder.keycloak_organization_id,
    'createdAt', funder.created_at,
		'createdBy', funder.created_by,
    'isCollaborative', funder.is_collaborative,
    'defaultTerminologySetId', funder.default_terminology_set_id
  );
END;
$$ LANGUAGE plpgsql;
