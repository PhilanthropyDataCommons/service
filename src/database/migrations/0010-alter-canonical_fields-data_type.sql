ALTER TABLE canonical_fields
  ALTER COLUMN data_type TYPE jsonb
  USING to_jsonb(data_type);
