CREATE TABLE canonical_fields (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  label VARCHAR NOT NULL,
  short_code VARCHAR NOT NULL UNIQUE,
  data_type VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE canonical_fields is
  'Canonical fields are those fields that are unique across organizations.';
COMMENT ON COLUMN canonical_fields.label is 'A word or phrase that communicates the meaning of the field for end users';
COMMENT ON COLUMN canonical_fields.short_code is 'An externally meaningful alphanumeric code tht can be used to reference this field without knowing the internal id';
COMMENT ON COLUMN canonical_fields.data_type is 'The type of data that can be associated with this field';
