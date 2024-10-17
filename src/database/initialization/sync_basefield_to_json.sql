SELECT drop_function('sync_basefield_to_json');

CREATE FUNCTION sync_basefield_to_json(sync_basefield sync_basefields)
RETURNS JSONB AS $$
DECLARE
  source_json JSONB;
BEGIN
  RETURN jsonb_build_object(
    'id', sync_basefield.id,
    'status', sync_basefield.status,
    'createdBy', sync_basefield.created_by,
    'synchronizationUrl', sync_basefield.synchronization_url,
    'statusUpdatedAt', to_json(sync_basefield.status_updated_at)::jsonb,
    'createdAt', to_json(sync_basefield.created_at)::jsonb
  );
END;
$$ LANGUAGE plpgsql;
