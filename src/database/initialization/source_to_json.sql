SELECT drop_function('source_to_json');

CREATE FUNCTION source_to_json(source sources)
RETURNS jsonb AS $$
DECLARE
  data_provider_json JSONB := NULL::JSONB;
  funder_json JSONB := NULL::JSONB;
  changemaker_json JSONB := NULL::JSONB;
  source_json JSONB := NULL::JSONB;
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

  -- The reason to go through the following hassle is we want null organization IDs returned.
  -- At the same time, we want to omit non-existent changemakers, funders, and data providers.
  -- Credit to https://stackoverflow.com/a/58310353 for the approach.
  SELECT jsonb_object_agg(name, value)
  INTO source_json
  FROM (VALUES
    ('id', to_jsonb(source.id)),
    ('label', to_jsonb(source.label)),
    ('dataProviderShortCode', to_jsonb(source.data_provider_short_code)),
    ('dataProvider', data_provider_json),
    ('funderShortCode', to_jsonb(source.funder_short_code)),
    ('funder', funder_json),
    ('changemakerId', to_jsonb(source.changemaker_id)),
    ('changemaker', changemaker_json),
    ('createdAt', to_jsonb(source.created_at))
  ) AS props(name, value)
  WHERE value IS NOT NULL;

  RETURN source_json;
END;
$$ LANGUAGE plpgsql;
