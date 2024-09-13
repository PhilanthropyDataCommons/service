CREATE OR REPLACE FUNCTION data_provider_to_json(data_provider data_providers)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'shortCode', data_provider.short_code,
    'name', data_provider.name,
    'createdAt', data_provider.created_at
  );
END;
$$ LANGUAGE plpgsql;
