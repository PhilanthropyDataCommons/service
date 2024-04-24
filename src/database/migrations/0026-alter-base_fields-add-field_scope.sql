CREATE TYPE field_scope AS ENUM ('proposal', 'organization');
ALTER TABLE base_fields
  ADD COLUMN scope field_scope NOT NULL default 'proposal';
ALTER TABLE base_fields
  ALTER COLUMN data_type DROP DEFAULT;

COMMENT ON COLUMN base_fields.scope IS
  'The type of entity that the base field is intended to describe.';
