CREATE TYPE field_type AS ENUM ('string', 'number', 'phone_number', 'email', 'URL', 'boolean');
ALTER TABLE base_fields DROP COLUMN data_type;
ALTER TABLE base_fields
  ADD COLUMN data_type field_type NOT NULL DEFAULT 'string';
ALTER TABLE base_fields
  ALTER COLUMN data_type DROP DEFAULT;

