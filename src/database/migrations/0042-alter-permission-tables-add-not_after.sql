ALTER TABLE user_changemaker_permissions
  ADD COLUMN not_after timestamp with time zone DEFAULT NULL;
ALTER TABLE user_funder_permissions
  ADD COLUMN not_after timestamp with time zone DEFAULT NULL;
ALTER TABLE user_data_provider_permissions
  ADD COLUMN not_after timestamp with time zone DEFAULT NULL;

CREATE OR REPLACE FUNCTION is_expired(
  not_after timestamp with time zone DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  RETURN NOT not_after IS NULL AND not_after < NOW();
END;
$$ LANGUAGE plpgsql;
