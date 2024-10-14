SELECT drop_function('source_to_json');

CREATE FUNCTION source_to_json(source sources)
RETURNS JSONB AS $$
DECLARE
  data_provider_json JSONB := NULL::JSONB;
  funder_json JSONB := NULL::JSONB;
  changemaker_json JSONB := NULL::JSONB;
BEGIN
  SELECT data_provider_to_json(data_providers.*)
  INTO data_provider_json
  FROM data_providers
  WHERE data_providers.short_code = source.data_provider_short_code;

  SELECT funder_to_json(funders.*)
  INTO funder_json
  FROM funders
  WHERE funders.short_code = source.funder_short_code;

  SELECT changemaker_to_json(changemakers.*)
  INTO changemaker_json
  FROM changemakers
  WHERE changemakers.id = source.changemaker_id;

  RETURN jsonb_strip_nulls(jsonb_build_object(
    'id', source.id,
    'label', source.label,
    'dataProviderShortCode', source.data_provider_short_code,
    'dataProvider', data_provider_json,
    'funderShortCode', source.funder_short_code,
    'funder', funder_json,
    'changemakerId', source.changemaker_id,
    'changemaker', changemaker_json,
    'createdAt', source.created_at
  ));
END;
$$ LANGUAGE plpgsql;
