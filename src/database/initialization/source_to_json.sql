SELECT drop_function('source_to_json');

CREATE FUNCTION source_to_json(source sources)
RETURNS JSONB AS $$
DECLARE
  data_provider_json JSONB := NULL::JSONB;
  funder_json JSONB := NULL::JSONB;
  organization_json JSONB := NULL::JSONB;
BEGIN
  SELECT data_provider_to_json(data_providers.*)
  INTO data_provider_json
  FROM data_providers
  WHERE data_providers.short_code = source.data_provider_short_code;

  SELECT funder_to_json(funders.*)
  INTO funder_json
  FROM funders
  WHERE funders.short_code = source.funder_short_code;

  SELECT organization_to_json(organizations.*)
  INTO organization_json
  FROM organizations
  WHERE organizations.id = source.organization_id;

  RETURN jsonb_strip_nulls(jsonb_build_object(
    'id', source.id,
    'label', source.label,
    'dataProviderShortCode', source.data_provider_short_code,
    'dataProvider', data_provider_json,
    'funderShortCode', source.funder_short_code,
    'funder', funder_json,
    'organizationId', source.organization_id,
    'organization', organization_json,
    'createdAt', source.created_at
  ));
END;
$$ LANGUAGE plpgsql;
