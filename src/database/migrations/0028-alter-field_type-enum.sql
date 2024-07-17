CREATE TYPE updated_field_type AS ENUM ('string', 'number', 'phone_number', 'email', 'url', 'boolean');
ALTER TABLE base_fields
  ALTER COLUMN data_type TYPE updated_field_type USING
  CASE
      WHEN data_type = 'URL' THEN 'url'::updated_field_type
      ELSE data_type::text::updated_field_type
  END;
DROP TYPE field_type CASCADE;
ALTER TYPE updated_field_type RENAME to field_type;
