CREATE OR REPLACE FUNCTION source_to_json(source sources)
RETURNS JSONB AS $$
DECLARE
  related_entity_json JSONB := NULL::JSONB;
  related_entity_id INTEGER;
BEGIN
  IF source.source_type = 'data_provider' THEN
    related_entity_id := source.data_provider_id;
    SELECT data_provider_to_json(data_providers.*)
    INTO related_entity_json
    FROM data_providers
    WHERE data_providers.id = source.data_provider_id;
  ELSIF source.source_type = 'funder' THEN
    related_entity_id := source.funder_id;
    SELECT funder_to_json(funders.*)
    INTO related_entity_json
    FROM funders
    WHERE funders.id = source.funder_id;
  ELSIF source.source_type = 'organization' THEN
    related_entity_id := source.organization_id;
    SELECT organization_to_json(organizations.*)
    INTO related_entity_json
    FROM organizations
    WHERE organizations.id = source.organization_id;
  ELSE
    related_entity_id := NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', source.id,
    'sourceType', source.source_type,
    'label', source.label,
    'relatedEntityId', related_entity_id,
    'relatedEntity', related_entity_json,
    'createdAt', source.created_at
  );
END;
$$ LANGUAGE plpgsql;
